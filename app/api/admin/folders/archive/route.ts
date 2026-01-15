import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { getAllDescendantIds } from "@/lib/server-folders";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const body = await request.json();
    const { folderId, selectedUserId } = body as {
      folderId?: string;
      selectedUserId?: string;
    };

    if (!folderId || !selectedUserId) return error("Missing folderId or selectedUserId", 400);

    // Verify the folder exists and belongs to the selected user
    const folder = await prisma.file.findFirst({
      where: {
        id: folderId,
        type: "folder",
        uploadedById: selectedUserId,
      },
    });

    if (!folder) return error("Folder not found", 404);

    // Get all files in this folder and its subfolders recursively
    const allFileIds = await getAllDescendantIds(folderId, {
      uploadedById: selectedUserId,
    });

    // Archive all files and folders in the folder structure
    // Only the root folder being archived should have parentFolderId set to null
    // All other files and subfolders should maintain their parent-child relationships

    // First, archive the root folder with parentFolderId: null
    await prisma.file.update({
      where: {
        id: folderId,
        uploadedById: selectedUserId,
      },
      data: {
        isArchived: true,
        parentFolderId: null, // Only the root folder goes to archive root
      },
    });

    // Then archive all descendants while preserving their parent-child relationships
    const descendantIds = allFileIds.filter((id) => id !== folderId);
    if (descendantIds.length > 0) {
      await prisma.file.updateMany({
        where: {
          id: { in: descendantIds },
          uploadedById: selectedUserId,
        },
        data: {
          isArchived: true,
          // Don't change parentFolderId for descendants - keep the hierarchy
        },
      });
    }

    // Create a notification for the user about admin archiving the folder
    try {
      await prisma.notification.create({
        data: {
          title: "Folder archived by admin",
          message: `Your folder "${folder.name ?? "Untitled"}" and all its contents have been archived by an administrator.`,
          user: { connect: { id: selectedUserId } },
        },
      });
    } catch (notifyError) {
      console.error("Failed to create archive notification:", notifyError);
    }

    return NextResponse.json(
      { success: true, archivedCount: allFileIds.length },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error archiving folder by admin:", e);
    return error("Internal server error", 500);
  }
}
