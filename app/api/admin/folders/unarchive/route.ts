import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { getAllArchivedDescendantIds } from "@/lib/server-folders";

async function unarchiveRootFolder(folderId: string, uploadedById: string) {
  await prisma.file.update({
    where: { id: folderId, uploadedById },
    data: { isArchived: false, parentFolderId: null },
  });
}

async function unarchiveDescendants(descendantIds: string[], uploadedById: string) {
  if (descendantIds.length === 0) return;
  await prisma.file.updateMany({
    where: { id: { in: descendantIds }, uploadedById },
    data: { isArchived: false },
  });
}

async function notifyUserUnarchived(userId: string, folderName: string | null | undefined) {
  try {
    await prisma.notification.create({
      data: {
        title: "Folder unarchived by admin",
        message: `Your folder "${folderName ?? "Untitled"}" and all its contents have been unarchived by an administrator.`,
        user: { connect: { id: userId } },
      },
    });
  } catch (notifyError) {
    console.error("Failed to create unarchive notification:", notifyError);
  }
}

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

    // Verify the folder exists, belongs to the selected user, and is archived
    const folder = await prisma.file.findFirst({
      where: {
        id: folderId,
        type: "folder",
        uploadedById: selectedUserId,
        isArchived: true,
      },
    });

    if (!folder) return error("Archived folder not found", 404);

    // Get all files in this folder and its subfolders recursively
    const allFileIds = await getAllArchivedDescendantIds(folderId);

    // Unarchive all files and folders in the folder structure
    // Only the root folder being unarchived should have parentFolderId set to null
    // All other files and subfolders should maintain their parent-child relationships

    // First, unarchive the root folder with parentFolderId: null
    await unarchiveRootFolder(folderId, selectedUserId);

    // Then unarchive all descendants while preserving their parent-child relationships
    const descendantIds = allFileIds.filter((id) => id !== folderId);
    await unarchiveDescendants(descendantIds, selectedUserId);

    // Create a notification for the user about admin unarchiving the folder
    await notifyUserUnarchived(selectedUserId, folder.name);

    return NextResponse.json({ success: true, unarchivedCount: allFileIds.length }, { status: 200 });
  } catch (e) {
    console.error("Error unarchiving folder by admin:", e);
    return error("Internal server error", 500);
  }
}
