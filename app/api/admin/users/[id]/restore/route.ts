import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Forbidden", 403);

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return error("User not found", 404);

    // Double-check restorable state and non-null deleteUserAt
    if (!user.isRestorable || !user.deleteUserAt) {
      return error("User is not in restorable state", 400);
    }

    await prisma.user.update({
      where: { id },
      data: {
        isRestorable: false,
        deleteUserAt: null,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, message: "User restored" }, { status: 200 });
  } catch (err) {
    console.error("Admin restore user error:", err);
    return error("Internal server error", 500);
  }
}
