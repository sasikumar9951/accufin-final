import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Forbidden", 403);

    const users = await prisma.user.findMany({
      where: {
        isRestorable: true,
        NOT: { deleteUserAt: null },
      },
      orderBy: { deleteUserAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        sinNumber: true,
        businessNumber: true,
        createdAt: true,
        deleteUserAt: true,
        isActive: true,
        isRestorable: true,
      },
    });

    return NextResponse.json({ ok: true, users }, { status: 200 });
  } catch (err) {
    console.error("Admin restorable users error:", err);
    return error("Internal server error", 500);
  }
}
