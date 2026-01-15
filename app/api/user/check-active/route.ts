import {NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireUserSession();
    if (!session) return NextResponse.json({ active: false, error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true },
    });
    return NextResponse.json({ active: !!user?.isActive });
  } catch (e) {
    console.error("Error checking user active status:", e);
    return error("Internal server error", 500);
  }
}


