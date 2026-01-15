import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

function getRoundedExpiryDate(hoursAhead: number): Date {
  const now = new Date();
  const expiry = new Date(now);
  expiry.setHours(expiry.getHours() + hoursAhead, 0, 0, 0);
  return expiry;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Forbidden", 403);

    const { id } = await params;

    if (id === session.user.id) return error("Cannot delete yourself", 400);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return error("User not found", 404);

    // If already scheduled, prevent duplicate scheduling
    if (user.isRestorable && user.deleteUserAt) {
      return error("User already scheduled for deletion", 400);
    }

    const deleteAt = getRoundedExpiryDate(24);
    if (!(deleteAt instanceof Date) || Number.isNaN(deleteAt.getTime())) {
      return error("Failed to compute deletion date", 500);
    }

    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        isRestorable: true,
        deleteUserAt: deleteAt,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "User marked for deletion. Can be restored until expiry.",
        deleteUserAt: deleteAt,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Admin soft-delete user error:", err);
    return error("Internal server error", 500);
  }
}
