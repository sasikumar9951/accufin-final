import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";

// GET - Get individual form details
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const { id } = await params;

    const form = await prisma.forms.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        isActive: true,
        isCompulsory: true,
        privacyLabel: true,
        createdAt: true,
        updatedAt: true,
        sequence: true,
        fieldsCount: true,
        responsesCount: true,
        assignedUsersCount: true,
        inputs: true,
        selections: true,
        multipleChoice: true,
        ratings: true,
        matrices: true,
        netPromoterScores: true,
        separators: true,
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!form) return error("Form not found", 404);

    return NextResponse.json(form);
  } catch (err) {
    console.error("Error fetching form:", err);
    return error("Failed to fetch form", 500);
  }
}

// PUT - Update form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const { id } = await params;

    const body = await request.json();
    const { title, description, privacyLabel, fields, assignedUserIds } = body;

    if (!title || !fields || !Array.isArray(fields))
      return error("Title and fields are required", 400);

    // Update form with all fields in a transaction (increase timeout for large forms)
    const result = await prisma.$transaction(
      async (tx: any) => {
        // Delete existing fields
        await tx.input.deleteMany({
          where: { formId: id },
        });

        await tx.selection.deleteMany({
          where: { formId: id },
        });

        await tx.multipleChoice.deleteMany({
          where: { formId: id },
        });

        await tx.rating.deleteMany({
          where: { formId: id },
        });

        await tx.matrix.deleteMany({
          where: { formId: id },
        });

        await tx.netPromoterScore.deleteMany({
          where: { formId: id },
        });

        await tx.separator.deleteMany({
          where: { formId: id },
        });

        const sequence: string[] = [];

        // Create new fields based on type
        for (const field of fields) {
          if (field.type === "input") {
            const input = await tx.input.create({
              data: {
                label: field.label,
                required: field.required || false,
                type: field.inputType || "text",
                formId: id,
              },
            });
            sequence.push(input.id);
          } else if (field.type === "selection") {
            const selection = await tx.selection.create({
              data: {
                label: field.label,
                required: field.required || false,
                options: field.options || [],
                formId: id,
              },
            });
            sequence.push(selection.id);
          } else if (field.type === "multipleChoice") {
            const multipleChoice = await tx.multipleChoice.create({
              data: {
                label: field.label,
                required: field.required || false,
                maxChoices: field.maxChoices,
                options: field.options || [],
                formId: id,
              },
            });
            sequence.push(multipleChoice.id);
          } else if (field.type === "rating") {
            const rating = await tx.rating.create({
              data: {
                question: field.label,
                required: field.required || false,
                maxRating: field.maxRating || 5,
                showLabels: field.showLabels || false,
                labels: field.labels || [],
                formId: id,
              },
            });
            sequence.push(rating.id);
          } else if (field.type === "matrix") {
            const matrix = await tx.matrix.create({
              data: {
                title: field.label,
                required: field.required || false,
                rows: field.rows || [],
                columns: field.columns || [],
                formId: id,
              },
            });
            sequence.push(matrix.id);
          } else if (field.type === "netPromoterScore") {
            const netPromoterScore = await tx.netPromoterScore.create({
              data: {
                question: field.label,
                required: field.required || false,
                leftLabel: field.leftLabel || "Not at all likely",
                rightLabel: field.rightLabel || "Extremely likely",
                maxScore: field.maxScore || 10,
                formId: id,
              },
            });
            sequence.push(netPromoterScore.id);
          } else if (field.type === "separator") {
            const separator = await tx.separator.create({
              data: {
                title: field.label,
                description: field.description || null,
                formId: id,
              },
            });
            sequence.push(separator.id);
          }
        }

        const computedFieldsCount = sequence.length;
        const computedAssignedUsersCount = Array.isArray(assignedUserIds)
          ? assignedUserIds.length
          : 0;

        // Update the form with new data, sequence and counts
        const updatedForm = await tx.forms.update({
          where: { id },
          data: {
            title,
            description,
            privacyLabel:
              privacyLabel ||
              "I consent to the processing of my personal data and agree to the privacy policy",
            sequence,
            fieldsCount: computedFieldsCount,
            assignedUsers:
              assignedUserIds && assignedUserIds.length > 0
                ? {
                    set: assignedUserIds.map((userId: string) => ({
                      id: userId,
                    })),
                  }
                : {
                    set: [],
                  },
            assignedUsersCount: computedAssignedUsersCount,
          },
        });

        return updatedForm;
      },
      { timeout: 30000 },
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error updating form:", err);
    return error("Failed to update form", 500);
  }
}
