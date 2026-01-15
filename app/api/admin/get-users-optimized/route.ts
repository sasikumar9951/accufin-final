import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    // Get all admin user IDs
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    if (adminUsers.length === 0) {
      return NextResponse.json(
        { error: "No admin users found" },
        { status: 404 }
      );
    }

    // Get active users first
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        isAdmin: false, // Exclude admin users from the list
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // const usersWithCounts = await Promise.all(
    //   users.map(async (user) => {
    //     // Get all files uploaded by this user
    //     const userFiles = await prisma.file.findMany({
    //       where: {
    //         uploadedById: user.id,
    //         isArchived: false,
    //       },
    //       select: {
    //         type: true,
    //       },
    //     });

    //     return {
    //       id: user.id,
    //       name: user.name,
    //       email: user.email,
    //       uploadedFiles,
    //       uploadedFolders,
    //     };
    //   })
    // );

    return NextResponse.json(users);
  } catch (err) {
    console.error("Error getting optimized users:", err);
    return error("Internal server error", 500);
  }
}
