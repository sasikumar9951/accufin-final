import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
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
    console.error("Error updating notification:", e);
    return error("Internal server error", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const { id } = await params;
    await prisma.notification.deleteMany({ where: { id, userId: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error deleting notification:", e);
    return error("Internal server error", 500);
  }
}


