import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized - Admin access required", 403);

    const { userId, isAdmin } = await request.json();

    if (!userId || typeof isAdmin !== "boolean") return error("Invalid request data", 400);

    // Prevent admin from removing their own admin status
    if (session.user.id === userId && !isAdmin) return error("Cannot remove your own admin privileges", 400);

    // Update user's admin status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User ${isAdmin ? "promoted to" : "removed from"} admin successfully`,
    });
  } catch (err) {
    console.error("Error toggling admin status:", err);
    return error("Internal server error", 500);
  }
}
