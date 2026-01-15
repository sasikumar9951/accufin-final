import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";

export async function POST() {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);
    await prisma.notification.updateMany({
      where: { userId: session.user.id },
      data: { isRead: true },
    });
    return NextResponse.json(
      { message: "Notifications marked as read" },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return error("Internal server error", 500);
  }
}
