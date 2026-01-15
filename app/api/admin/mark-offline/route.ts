import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Admin access required", 403);

    // Find users who haven't been active in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const inactiveUsers = await prisma.user.findMany({
      where: {
        isOnline: true,
        OR: [
          { lastActivityAt: { lt: twoMinutesAgo } },
          { lastActivityAt: null },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastActivityAt: true,
      },
    });

    // Mark these users as offline
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: inactiveUsers.map((user) => user.id) },
      },
      data: {
        isOnline: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        inactiveUsersCount: inactiveUsers.length,
        updatedCount: updateResult.count,
        inactiveUsers: inactiveUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          lastActivityAt: user.lastActivityAt,
        })),
      },
    });
  } catch (err) {
    console.error("Error marking users as offline:", err);
    return error("Failed to mark users as offline", 500);
  }
}
