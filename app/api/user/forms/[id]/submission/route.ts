import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserSession, error } from "@/lib/api-helpers";

// GET - Get user's form submission
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);
    const paramsID = (await params).id;
    // Get user's form submission with answers
    const formResponse = await prisma.formResponse.findFirst({
      where: {
        formId: paramsID,
        userId: session.user.id,
      },
      select: {
        id: true,
        isChecked: true,
        createdAt: true,
        form: {
          select: {
            title: true,
            description: true,
            isCompulsory: true,
            sequence: true,
            inputs: {
              select: {
                id: true,
                label: true,
              },
            },
            selections: {
              select: {
                id: true,
                label: true,
              },
            },
            multipleChoice: {
              select: {
                id: true,
                label: true,
              },
            },
            ratings: {
              select: {
                id: true,
                question: true,
                maxRating: true,
              },
            },
            matrices: {
              select: {
                id: true,
                title: true,
              },
            },
            netPromoterScores: {
              select: {
                id: true,
                question: true,
                maxScore: true,
              },
            },
            separators: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        answers: {
          select: {
            id: true,
            fieldId: true,
            fieldType: true,
            value: true,
            rowId: true,
            columnId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!formResponse) return error("Form submission not found", 404);

    // Create field mapping for labels and additional field data
    const fieldLabels: { [fieldId: string]: string } = {};
    const fieldData: { [fieldId: string]: any } = {};

    for (const field of formResponse.form.inputs) {
      fieldLabels[field.id] = field.label || "";
      fieldData[field.id] = { type: "input" };
    }
    for (const field of formResponse.form.selections) {
      fieldLabels[field.id] = field.label || "";
      fieldData[field.id] = { type: "selection" };
    }
    for (const field of formResponse.form.multipleChoice) {
      fieldLabels[field.id] = field.label || "";
      fieldData[field.id] = { type: "multipleChoice" };
    }
    for (const field of formResponse.form.ratings) {
      fieldLabels[field.id] = field.question || "";
      fieldData[field.id] = { type: "rating", maxRating: field.maxRating };
    }
    for (const field of formResponse.form.matrices) {
      fieldLabels[field.id] = field.title || "";
      fieldData[field.id] = { type: "matrix" };
    }
    for (const field of formResponse.form.netPromoterScores) {
      fieldLabels[field.id] = field.question || "";
      fieldData[field.id] = {
        type: "netPromoterScore",
        maxScore: field.maxScore,
      };
    }
    for (const field of formResponse.form.separators) {
      fieldLabels[field.id] = field.title || "";
      fieldData[field.id] = { type: "separator" };
    }

    // Add labels and field data to answers
    const answersWithLabels = formResponse.answers.map((answer) => ({
      ...answer,
      fieldLabel: fieldLabels[answer.fieldId] || "Unknown Field",
      fieldData: fieldData[answer.fieldId] || {},
    }));

    const submission = {
      id: formResponse.id,
      formTitle: formResponse.form.title,
      formDescription: formResponse.form.description,
      isCompulsory: formResponse.form.isCompulsory,
      isChecked: formResponse.isChecked,
      submittedAt: formResponse.createdAt.toISOString(),
      answers: answersWithLabels,
    };

    return NextResponse.json(submission);
  } catch (err) {
    console.error("Error fetching form submission:", err);
    return error("Failed to fetch form submission", 500);
  }
}
