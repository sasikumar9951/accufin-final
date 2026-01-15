import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";

// Helper function to create field mapping for labels
const createFieldLabels = (form: any): { [fieldId: string]: string } => {
  const fieldLabels: { [fieldId: string]: string } = {};

  for (const field of form.inputs) {
    fieldLabels[field.id] = field.label || "";
  }
  for (const field of form.selections) {
    fieldLabels[field.id] = field.label || "";
  }
  for (const field of form.multipleChoice) {
    fieldLabels[field.id] = field.label || "";
  }
  for (const field of form.ratings) {
    fieldLabels[field.id] = field.question || "";
  }
  for (const field of form.matrices) {
    fieldLabels[field.id] = field.title || "";
  }
  for (const field of form.netPromoterScores) {
    fieldLabels[field.id] = field.question || "";
  }
  for (const field of form.separators) {
    fieldLabels[field.id] = field.title || "";
  }

  return fieldLabels;
};

// Helper function to build field object from a specific field type
const buildFieldObject = (
  fieldId: string,
  form: any
): Record<string, any> | null => {
  const input = form.inputs.find((i: any) => i.id === fieldId);
  if (input) {
    return {
      id: input.id,
      type: "input" as const,
      label: input.label || "",
      required: input.required,
      inputType: input.type || "text",
    };
  }

  const selection = form.selections.find((s: any) => s.id === fieldId);
  if (selection) {
    return {
      id: selection.id,
      type: "selection" as const,
      label: selection.label || "",
      required: selection.required,
      options: selection.options,
    };
  }

  const multipleChoice = form.multipleChoice.find((m: any) => m.id === fieldId);
  if (multipleChoice) {
    return {
      id: multipleChoice.id,
      type: "multipleChoice" as const,
      label: multipleChoice.label || "",
      required: multipleChoice.required,
      options: multipleChoice.options,
      maxChoices: multipleChoice.maxChoices || 1,
    };
  }

  const rating = form.ratings.find((r: any) => r.id === fieldId);
  if (rating) {
    return {
      id: rating.id,
      type: "rating" as const,
      label: rating.question || "",
      required: rating.required,
      maxRating: rating.maxRating,
      showLabels: rating.showLabels,
      labels: rating.labels,
    };
  }

  const matrix = form.matrices.find((m: any) => m.id === fieldId);
  if (matrix) {
    return {
      id: matrix.id,
      type: "matrix" as const,
      label: matrix.title || "",
      required: matrix.required,
      rows: matrix.rows,
      columns: matrix.columns,
    };
  }

  const netPromoterScore = form.netPromoterScores.find((n: any) => n.id === fieldId);
  if (netPromoterScore) {
    return {
      id: netPromoterScore.id,
      type: "netPromoterScore" as const,
      label: netPromoterScore.question || "",
      required: netPromoterScore.required,
      leftLabel: netPromoterScore.leftLabel,
      rightLabel: netPromoterScore.rightLabel,
      maxScore: netPromoterScore.maxScore,
    };
  }

  const separator = form.separators.find((s: any) => s.id === fieldId);
  if (separator) {
    return {
      id: separator.id,
      type: "separator" as const,
      label: separator.title || "",
      required: false,
      description: separator.description,
    };
  }

  return null;
};

// Helper function to build fields array in sequence order
const buildFieldsArray = (form: any): any[] => {
  const fields = [];

  for (const fieldId of form.sequence) {
    const field = buildFieldObject(fieldId, form);
    if (field) {
      fields.push(field);
    }
  }

  return fields;
};

// GET - Get single form submission for admin
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const paramsId = (await params).id;

    // Get form submission with all related data
    const formResponse = await prisma.formResponse.findUnique({
      where: { id: paramsId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        form: {
          include: {
            inputs: true,
            selections: true,
            multipleChoice: true,
            ratings: true,
            matrices: true,
            netPromoterScores: true,
            separators: true,
          },
        },
        answers: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!formResponse) return error("Form submission not found", 404);

    // Create field mapping for labels
    const fieldLabels = createFieldLabels(formResponse.form);

    // Build the fields array in sequence order
    const fields = buildFieldsArray(formResponse.form);

    // Add labels to answers
    const answersWithLabels = formResponse.answers.map((answer) => ({
      ...answer,
      fieldLabel: fieldLabels[answer.fieldId] || "Unknown Field",
    }));

    const submissionData = {
      id: formResponse.id,
      formTitle: formResponse.form.title,
      formDescription: formResponse.form.description,
      isCompulsory: formResponse.form.isCompulsory,
      isChecked: formResponse.isChecked,
      submittedAt: formResponse.createdAt.toISOString(),
      userEmail: formResponse.user.email,
      userName: formResponse.user.name || formResponse.user.email,
      fields,
      answers: answersWithLabels,
    };

    return NextResponse.json(submissionData);
  } catch (err) {
    console.error("Error fetching form submission:", err);
    return error("Failed to fetch form submission", 500);
  }
}

// DELETE - Delete a single form submission (and its answers) for admin
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const paramsId = (await params).id;

    // Ensure the response exists
    const existing = await prisma.formResponse.findUnique({
      where: { id: paramsId },
      select: { id: true },
    });

    if (!existing) return error("Form submission not found", 404);

    // Delete answers first, then the response
    await prisma.formAnswer.deleteMany({ where: { formResponseId: paramsId } });
    await prisma.formResponse.delete({ where: { id: paramsId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting form submission:", err);
    return error("Failed to delete form submission", 500);
  }
}
