import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";

// GET - Get all responses for a specific form
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    // First check if form exists and get form fields for label mapping
    const form = await prisma.forms.findUnique({
      where: { id: (await params).id },
      include: {
        inputs: true,
        selections: true,
        multipleChoice: true,
        ratings: true,
        matrices: true,
        netPromoterScores: true,
        separators: true,
      },
    });

    if (!form) return error("Form not found", 404);

    // Get all responses for this form
    const { id } = await params;
    const responses = await prisma.formResponse.findMany({
      where: { formId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Create field label mapping
    const fieldLabels: Record<string, string> = {};

    for (const input of form.inputs || []) {
      fieldLabels[input.id] = input.label || "Untitled Field";
    }

    for (const selection of form.selections || []) {
      fieldLabels[selection.id] = selection.label || "Untitled Field";
    }

    for (const multipleChoice of form.multipleChoice || []) {
      fieldLabels[multipleChoice.id] = multipleChoice.label || "Untitled Field";
    }

    for (const rating of form.ratings || []) {
      fieldLabels[rating.id] = rating.question || "Untitled Field";
    }

    for (const matrix of form.matrices || []) {
      fieldLabels[matrix.id] = matrix.title || "Untitled Field";
    }

    for (const nps of form.netPromoterScores || []) {
      fieldLabels[nps.id] = nps.question || "Untitled Field";
    }

    for (const separator of form.separators || []) {
      fieldLabels[separator.id] = separator.title || "Untitled Field";
    }

    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      fieldLabels,
      responses,
    };

    return NextResponse.json(formData);
  } catch (err) {
    console.error("Error fetching form responses:", err);
    return error("Failed to fetch form responses", 500);
  }
}
