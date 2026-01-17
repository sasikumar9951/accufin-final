import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import { getSignedUrlFromPath } from "@/lib/s3";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const users = await prisma.user.findMany({
        where:{
            isActive: true,
        },
      select: {
        id: true,
        name: true,
        sinNumber: true,
        businessNumber: true,
        dateOfBirth: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        occupation: true,
        contactNumber: true,
        profileUrl: true,
        isAdmin: true,
        isActive: true,
        _count: {
          select: {
            uploadedFiles: true,
            formResponses: true,
          },
        },
      },
    });

    // Get files received from admin for each user
    const usersWithFileCounts = await Promise.all(
      users.map(async (user: any) => {
        const filesReceivedFromAdmin = await prisma.file.count({
          where: {
            receivedById: user.id,
            uploadedBy: {
              isAdmin: true,
            },
          },
        });

        const filesUploadedToAdmin = await prisma.file.count({
          where: {
            uploadedById: user.id,
            receivedBy: {
              isAdmin: true,
            },
            // Count only real files, exclude folders
            type: { not: "folder" },
          },
        });

        const foldersUploadedToAdmin = await prisma.file.count({
          where: {
            uploadedById: user.id,
            receivedBy: {
              isAdmin: true,
            },
            type: "folder",
          },
        });

        return {
          ...user,
          filesReceivedFromAdmin,
          filesUploadedToAdmin,
          foldersUploadedToAdmin,
        };
      })
    );

    const signedUrlUsers = await Promise.all(
      usersWithFileCounts.map(async (user: any) => {
        if (user.profileUrl) {
          const signedUrl = await getSignedUrlFromPath(user.profileUrl);
          return { ...user, profileUrl: signedUrl };
        }
        return user;
      })
    );

    const usersWithAllCounts = signedUrlUsers.map((user: any) => {
      return {
        ...user,
        uploadedFiles: user.filesUploadedToAdmin,
        uploadedFolders: user.foldersUploadedToAdmin,
        formResponses: user._count.formResponses,
        filesReceivedFromAdmin: user.filesReceivedFromAdmin,
      };
    });
    return NextResponse.json(usersWithAllCounts);
  } catch (e) {
    console.error("Error getting users:", e);
    return error("Internal server error", 500);
  }
}
