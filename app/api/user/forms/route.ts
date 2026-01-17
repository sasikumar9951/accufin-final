import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserSession, error } from "@/lib/api-helpers";

// GET - Get all active forms for the user with their completion status
export async function GET() {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);

    // Get all active forms that are either assigned to this user or available to all users
    const activeForms = await prisma.forms.findMany({
      where: {
        isActive: true,
        OR: [
          { assignedUsers: { none: {} } }, // Forms with no assigned users (available to all)
          { assignedUsers: { some: { id: session.user.id } } }, // Forms assigned to this user
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        isActive: true,
        isCompulsory: true,
        createdAt: true,
      },
      orderBy: [
        { isCompulsory: "desc" }, // Show compulsory forms first
        { createdAt: "desc" },
      ],
    });

    // Get user's form responses to check completion status
    const userResponses = await prisma.formResponse.findMany({
      where: { userId: session.user.id },
      select: {
        formId: true,
        createdAt: true,
      },
    });

    // Create a map of completed forms
    const completedFormsMap = new Map();
    for (const response of userResponses) {
      completedFormsMap.set(response.formId, response.createdAt);
    }

    // Combine forms with completion status
    const formsWithStatus = activeForms.map((form: any) => ({
      ...form,
      isCompleted: completedFormsMap.has(form.id),
      completedAt: completedFormsMap.get(form.id) || null,
    }));

    return NextResponse.json(formsWithStatus);
  } catch (err) {
    console.error("Error fetching user forms:", err);
    return error("Failed to fetch forms", 500);
  }
}
