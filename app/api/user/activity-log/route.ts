import { NextRequest, NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);

    const body = await request.json();

    // Update user's online status and last activity
    const now = new Date();
    const isOnline = body.isOnline !== false; // Default to true unless explicitly false

    await prisma.user.update({
      where: { id: body.userId },
      data: {
        isOnline: isOnline,
        lastActivityAt: now,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to log activity:", err);
    return error("Failed to log activity", 500);
  }
}
