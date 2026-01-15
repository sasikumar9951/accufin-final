import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const { userId, isActive } = await request.json();
    if (!userId || typeof isActive !== "boolean") return error("Invalid payload", 400);

    if (session.user.id === userId) return error("You cannot change your own status", 400);

    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return NextResponse.json({ message: `User has been ${isActive ? "activated" : "deactivated"}.` });
  } catch (e) {
    console.error("Error toggling user active status:", e);
    return error("Internal server error", 500);
  }
}


