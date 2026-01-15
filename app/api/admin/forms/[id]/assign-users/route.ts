import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { _req: Request,params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const { id } = await params;
    const body = await request.json();
    const { userIds } = body;

    if (!id) return error("Form ID is required", 400);

    // Update the form's assigned users and assignedUsersCount
    const updatedForm = await prisma.forms.update({
      where: { id },
      data: {
        assignedUsers: {
          set: userIds.map((userId: string) => ({ id: userId })),
        },
        assignedUsersCount: Array.isArray(userIds) ? userIds.length : 0,
      },
      include: {
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedForm);
  } catch (err) {
    console.error("Error updating assigned users:", err);
    return error("Failed to update assigned users", 500);
  }
}
