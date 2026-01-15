import { NextRequest, NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);
    const { id } = await params;
    const body = await request.json();
    const { isRead } = body as { isRead?: boolean };
    if (typeof isRead !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { isRead },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);
    const { id } = await params;
    await prisma.notification.deleteMany({ where: { id, userId: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return error("Internal server error", 500);
  }
}


