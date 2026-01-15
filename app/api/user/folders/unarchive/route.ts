import { NextRequest, NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { getAllArchivedDescendantIds } from "@/lib/server-folders";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);

    const body = await request.json();
    const { folderId } = body as { folderId?: string };

    if (!folderId) return error("Missing folderId", 400);

    // Verify the folder belongs to the user and is archived
    const folder = await prisma.file.findFirst({
      where: {
        id: folderId,
        type: "folder",
        uploadedById: session.user.id,
        isArchived: true,
      },
    });

    if (!folder) return error("Archived folder not found", 404);

    // Get all files in this folder and its subfolders recursively (archived only)
    const allFileIds = await getAllArchivedDescendantIds(folderId, {
      uploadedById: session.user.id,
    });

    // Unarchive all files and folders in the folder structure
    // Only the root folder being unarchived should have parentFolderId set to null
    // All other files and subfolders should maintain their parent-child relationships

    // First, unarchive the root folder with parentFolderId: null
    await prisma.file.update({
      where: {
        id: folderId,
        uploadedById: session.user.id,
      },
      data: {
        isArchived: false,
        parentFolderId: null, // Only the root folder goes to upload root
      },
    });

    // Then unarchive all descendants while preserving their parent-child relationships
    const descendantIds = allFileIds.filter((id) => id !== folderId);
    if (descendantIds.length > 0) {
      await prisma.file.updateMany({
        where: {
          id: { in: descendantIds },
          uploadedById: session.user.id,
        },
        data: {
          isArchived: false,
          // Don't change parentFolderId for descendants - keep the hierarchy
        },
      });
    }

    // Create a notification for the user about unarchiving the folder
    if (session.user.id) {
      try {
        await prisma.notification.create({
          data: {
            title: "Folder unarchived",
            message: `Your folder "${folder.name ?? "Untitled"}" and all its contents have been unarchived.`,
            user: { connect: { id: session.user.id } },
          },
        });
      } catch (notifyError) {
        console.error("Failed to create unarchive notification:", notifyError);
      }
    }

    return NextResponse.json(
      { success: true, unarchivedCount: allFileIds.length },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error unarchiving folder:", e);
    return error("Internal server error", 500);
  }
}
