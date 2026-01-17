import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Admin access required", 403);

    // Get all users with their online status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        lastActivityAt: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [
        { isOnline: "desc" }, // Online users first
        { lastActivityAt: "desc" }, // Then by last activity
      ],
    });

    // Calculate time since last activity for each user
    const now = new Date();
    const usersWithActivityInfo = users.map((user: any) => {
      const timeSinceLastActivity = user.lastActivityAt
        ? Math.floor(
            (now.getTime() - user.lastActivityAt.getTime()) / 1000 / 60
          ) // minutes
        : null;

      return {
        ...user,
        timeSinceLastActivity,
        isRecentlyActive:
          timeSinceLastActivity !== null && timeSinceLastActivity <= 2, // Active within last 2 minutes
      };
    });

    // Separate online and offline users
    const onlineUsers = usersWithActivityInfo.filter(
      (user) => user.isOnline && user.isRecentlyActive
    );
    const offlineUsers = usersWithActivityInfo.filter(
      (user) => !user.isOnline || !user.isRecentlyActive
    );

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: users.length,
        onlineUsers: onlineUsers.length,
        offlineUsers: offlineUsers.length,
        users: usersWithActivityInfo,
        onlineUsersList: onlineUsers,
        offlineUsersList: offlineUsers,
      },
    });
  } catch (err) {
    console.error("Error fetching online users:", err);
    return error("Failed to fetch online users", 500);
  }
}
