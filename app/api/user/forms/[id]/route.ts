import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserSession, error } from "@/lib/api-helpers";

// GET - Get form details for filling
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);

    const { id } = await params;

    // Check if user already submitted this form
    const existingResponse = await prisma.formResponse.findFirst({
      where: {
        formId: id,
        userId: session.user.id,
      },
    });

    if (existingResponse) {
      return error("You have already submitted this form", 400);
    }

    // Get form details with all fields
    const form = await prisma.forms.findUnique({
      where: { id },
      include: {
        inputs: {
          select: {
            id: true,
            label: true,
            required: true,
            type: true,
          },
        },
        selections: {
          select: {
            id: true,
            label: true,
            required: true,
            options: true,
          },
        },
        multipleChoice: {
          select: {
            id: true,
            label: true,
            required: true,
            options: true,
            maxChoices: true,
          },
        },
        ratings: {
          select: {
            id: true,
            question: true,
            required: true,
            maxRating: true,
            showLabels: true,
            labels: true,
          },
        },
        matrices: {
          select: {
            id: true,
            title: true,
            required: true,
            rows: true,
            columns: true,
          },
        },
        netPromoterScores: {
          select: {
            id: true,
            question: true,
            required: true,
            leftLabel: true,
            rightLabel: true,
            maxScore: true,
          },
        },
        separators: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!form) return error("Form not found", 404);

    if (!form.isActive) return error("This form is no longer active", 400);

    // Build the fields array in sequence order
    const fields: any[] = [];

    for (const fieldId of form.sequence) {
      const input = form.inputs.find((i) => i.id === fieldId);
      const selection = form.selections.find((s) => s.id === fieldId);
      const multipleChoice = form.multipleChoice.find((m) => m.id === fieldId);
      const rating = form.ratings.find((r) => r.id === fieldId);
      const matrix = form.matrices.find((m) => m.id === fieldId);
      const netPromoterScore = form.netPromoterScores.find(
        (n) => n.id === fieldId
      );
      const separator = form.separators.find((s) => s.id === fieldId);

      if (input) {
        fields.push({
          id: input.id,
          type: "input" as const,
          label: input.label || "",
          required: input.required,
          inputType: input.type || "text",
        });
      } else if (selection) {
        fields.push({
          id: selection.id,
          type: "selection" as const,
          label: selection.label || "",
          required: selection.required,
          options: selection.options,
        });
      } else if (multipleChoice) {
        fields.push({
          id: multipleChoice.id,
          type: "multipleChoice" as const,
          label: multipleChoice.label || "",
          required: multipleChoice.required,
          options: multipleChoice.options,
          maxChoices: multipleChoice.maxChoices || 1,
        });
      } else if (rating) {
        fields.push({
          id: rating.id,
          type: "rating" as const,
          label: rating.question || "",
          required: rating.required,
          maxRating: rating.maxRating || 5,
          showLabels: rating.showLabels || false,
          labels: rating.labels || [],
        });
      } else if (matrix) {
        fields.push({
          id: matrix.id,
          type: "matrix" as const,
          label: matrix.title || "",
          required: matrix.required,
          rows: matrix.rows || [],
          columns: matrix.columns || [],
        });
      } else if (netPromoterScore) {
        fields.push({
          id: netPromoterScore.id,
          type: "netPromoterScore" as const,
          label: netPromoterScore.question || "",
          required: netPromoterScore.required,
          leftLabel: netPromoterScore.leftLabel || "Not at all likely",
          rightLabel: netPromoterScore.rightLabel || "Extremely likely",
          maxScore: netPromoterScore.maxScore || 10,
        });
      } else if (separator) {
        fields.push({
          id: separator.id,
          type: "separator" as const,
          label: separator.title || "",
          required: false, // Separators are never required
          description: separator.description || "",
        });
      }
    }

    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      isCompulsory: form.isCompulsory,
      privacyLabel: form.privacyLabel,
      fields,
    };

    return NextResponse.json(formData);
  } catch (err) {
    console.error("Error fetching form for filling:", err);
    return error("Failed to fetch form", 500);
  }
}
