import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserSession, error } from "@/lib/api-helpers";

interface FormAnswer {
  fieldId: string;
  fieldType: string;
  value: string;
  rowId?: string;
  columnId?: string;
}

interface SubmitFormRequest {
  answers: FormAnswer[];
  isChecked: boolean;
}

// Validate that all required fields have answers
const validateRequiredFields = (
  allFields: { id: string; required: boolean }[],
  answers: FormAnswer[]
): string | null => {
  const answeredFieldIds = new Set(answers.map((a) => a.fieldId));

  for (const field of allFields) {
    if (field.required && !answeredFieldIds.has(field.id)) {
      return `Required field ${field.id} is missing`;
    }
  }
  return null;
};

// Validate Net Promoter Score value
const validateNetPromoterScore = (
  answer: FormAnswer,
  netPromoterScores: { id: string; maxScore: number | null }[]
): string | null => {
  const netPromoterField = netPromoterScores.find(
    (f) => f.id === answer.fieldId
  );
  if (netPromoterField) {
    const score = Number.parseInt(answer.value);
    const maxScore = netPromoterField.maxScore || 10;
    if (Number.isNaN(score) || score < 0 || score > maxScore) {
      return `Invalid Net Promoter Score. Must be between 0 and ${maxScore}`;
    }
  }
  return null;
};

// Validate Rating value
const validateRating = (
  answer: FormAnswer,
  ratings: { id: string; maxRating: number | null }[]
): string | null => {
  const ratingField = ratings.find((f) => f.id === answer.fieldId);
  if (ratingField) {
    const rating = Number.parseInt(answer.value);
    const maxRating = ratingField.maxRating || 5;
    if (Number.isNaN(rating) || rating < 1 || rating > maxRating) {
      return `Invalid Rating. Must be between 1 and ${maxRating}`;
    }
  }
  return null;
};

// Validate field IDs and specific field types
const validateAnswers = (
  answers: FormAnswer[],
  allFields: { id: string; required: boolean }[],
  netPromoterScores: { id: string; maxScore: number | null }[],
  ratings: { id: string; maxRating: number | null }[]
): string | null => {
  const validFieldIds = new Set(allFields.map((f) => f.id));

  for (const answer of answers) {
    if (!validFieldIds.has(answer.fieldId)) {
      return `Invalid field ID: ${answer.fieldId}`;
    }

    if (answer.fieldType === "netPromoterScore") {
      const error = validateNetPromoterScore(answer, netPromoterScores);
      if (error) return error;
    }

    if (answer.fieldType === "rating") {
      const error = validateRating(answer, ratings);
      if (error) return error;
    }
  }
  return null;
};

// Collect all form fields into a single array
const collectAllFields = (form: any) => {
  return [
    ...form.inputs.map((f: any) => ({ id: f.id, required: f.required })),
    ...form.selections.map((f: any) => ({ id: f.id, required: f.required })),
    ...form.multipleChoice.map((f: any) => ({ id: f.id, required: f.required })),
    ...form.ratings.map((f: any) => ({ id: f.id, required: f.required })),
    ...form.matrices.map((f: any) => ({ id: f.id, required: f.required })),
    ...form.netPromoterScores.map((f: any) => ({
      id: f.id,
      required: f.required,
    })),
    ...form.separators.map((f: any) => ({ id: f.id, required: false })),
  ];
};

// Create form response in database transaction
const createFormResponse = async (
  userId: string,
  formId: string,
  isChecked: boolean,
  answers: FormAnswer[]
) => {
  return await prisma.$transaction(async (tx) => {
    const formResponse = await tx.formResponse.create({
      data: {
        userId,
        formId,
        isChecked,
      },
    });

    const formAnswers = await Promise.all(
      answers.map((answer) =>
        tx.formAnswer.create({
          data: {
            formResponseId: formResponse.id,
            fieldId: answer.fieldId,
            fieldType: answer.fieldType,
            value: answer.value,
            rowId: answer.rowId,
            columnId: answer.columnId,
          },
        })
      )
    );

    await tx.forms.update({
      where: { id: formId },
      data: {
        responsesCount: { increment: 1 },
      },
    });

    return { formResponse, formAnswers };
  });
};

// Create notifications for admins
const notifyAdmins = async (
  userName: string | null | undefined,
  formTitle: string
) => {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        title: `New form response submitted by ${userName} for "${formTitle}"`,
        message: `New form response submitted by ${userName} for "${formTitle}"`,
        userId: a.id,
        isRead: false,
      })),
    });
  }
};

// POST - Submit form response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);

    const body: SubmitFormRequest = await request.json();
    const { answers, isChecked } = body;

    // Validate request
    if (!Array.isArray(answers)) return error("Invalid answers format", 400);

    if (typeof isChecked !== "boolean") return error("Privacy consent is required", 400);

    // Check if user already submitted this form
    const existingResponse = await prisma.formResponse.findFirst({
      where: {
        formId: id,
        userId: session.user.id,
      },
    });

    if (existingResponse) return error("You have already submitted this form", 400);

    // Verify form exists and is active
    const form = await prisma.forms.findUnique({
      where: { id },
      include: {
        inputs: {
          select: {
            id: true,
            required: true,
          },
        },
        selections: {
          select: {
            id: true,
            required: true,
          },
        },
        multipleChoice: {
          select: {
            id: true,
            required: true,
          },
        },
        ratings: {
          select: {
            id: true,
            required: true,
            maxRating: true,
          },
        },
        matrices: {
          select: {
            id: true,
            required: true,
          },
        },
        netPromoterScores: {
          select: {
            id: true,
            required: true,
            maxScore: true,
          },
        },
        separators: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!form) return error("Form not found", 404);

    if (!form.isActive) return error("This form is no longer active", 400);

    // Collect all form fields
    const allFields = collectAllFields(form);

    // Validate required fields
    const requiredFieldError = validateRequiredFields(allFields, answers);
    if (requiredFieldError) return error(requiredFieldError, 400);

    // Validate field IDs and specific field types
    const validationError = validateAnswers(
      answers,
      allFields,
      form.netPromoterScores,
      form.ratings
    );
    if (validationError) return error(validationError, 400);

    // Create form response and answers in a transaction
    const result = await createFormResponse(
      session.user.id,
      id,
      isChecked,
      answers
    );

    // Notify admins
    await notifyAdmins(session.user.name, form.title);

    return NextResponse.json(
      {
        message: "Form submitted successfully",
        responseId: result.formResponse.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error submitting form response:", err);
    return error("Failed to submit form", 500);
  }
}
