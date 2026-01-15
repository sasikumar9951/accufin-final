import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function POST() {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    await prisma.notification.updateMany({
      where: { userId: session.user.id },
      data: { isRead: true },
    });
    return NextResponse.json(
      { message: "Notifications marked as read", ok: true },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error marking notifications as read:", e);
    return error("Internal server error", 500);
  }
}
