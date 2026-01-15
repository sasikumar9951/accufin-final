import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { batchMoveS3Objects } from "@/lib/s3";
import { getDescendantFiles, isDescendantFolder, generateAdminMovePath } from "@/lib/file-helpers";
import {
  validateTargetFolderAdmin,
  validateUserItemsAdmin,
} from "@/lib/admin-file-utils";
import { generateUniqueNamesForItems } from "@/lib/file-naming-utils";

interface BulkMoveItem {
  id: string;
  type: "file" | "folder";
}

interface AdminBulkMoveRequest {
  items: BulkMoveItem[];
  targetFolderId: string | null;
  userId: string; // The user whose files we're managing
  isPrivate: boolean; // Whether this is for private or response files
}

// (validators moved to shared utils)

// Check if target folder is a descendant of any folder being moved
const checkFolderDescendants = async (
  items: BulkMoveItem[],
  targetFolderId: string | null,
  userId: string,
  isPrivate: boolean
): Promise<boolean> => {
  if (!targetFolderId) return false;
  const whereExtra = { receivedById: userId, isAdminOnlyPrivateFile: isPrivate, type: "folder" } as const;
  for (const item of items) {
    if (item.type === "folder") {
      const isDescendant = await isDescendantFolder(item.id, targetFolderId, whereExtra);
      if (isDescendant) return true;
    }
  }
  return false;
};

// Process items and generate S3 operations and DB updates
const processItems = async (
  userItems: any[],
  targetFolderId: string | null,
  userId: string,
  isPrivate: boolean,
  adminId: string,
  uniqueNames: string[]
) => {
  const s3Operations: { source: string; destination: string }[] = [];
  const dbUpdates: {
    id: string;
    newPath: string;
    newParentFolderId: string | null;
    newName?: string;
  }[] = [];

  for (let i = 0; i < userItems.length; i++) {
    const userItem = userItems[i];
    const uniqueName = uniqueNames[i];
    if (userItem.type !== "folder" && userItem.path) {
      // Handle file move
      const newPath = generateAdminMovePath(
        userItem.path,
        targetFolderId,
        userId,
        isPrivate,
        adminId
      );

      s3Operations.push({
        source: userItem.path,
        destination: newPath,
      });

      dbUpdates.push({
        id: userItem.id,
        newPath: newPath,
        newParentFolderId: targetFolderId,
        newName: uniqueName,
      });
    } else if (userItem.type === "folder") {
      // Handle folder move - get all descendant files
      const descendantFiles = await getDescendantFiles(userItem.id, {
        receivedById: userId,
        isAdminOnlyPrivateFile: isPrivate,
      });

      // Add S3 operations for all descendant files
      for (const file of descendantFiles) {
        if (file.path) {
          const newPath = generateAdminMovePath(
            file.path,
            targetFolderId,
            userId,
            isPrivate,
            adminId
          );

          s3Operations.push({
            source: file.path,
            destination: newPath,
          });

          dbUpdates.push({
            id: file.id,
            newPath: newPath,
            newParentFolderId: file.parentFolderId, // Keep same relative structure
          });
        }
      }

      // Add folder itself to DB updates (no S3 operation needed for folders)
      dbUpdates.push({
        id: userItem.id,
        newPath: "", // Folders don't have S3 paths
        newParentFolderId: targetFolderId,
        newName: uniqueName,
      });
    }
  }

  return { s3Operations, dbUpdates };
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AdminBulkMoveRequest = await request.json();
    const { items, targetFolderId, userId, isPrivate } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items to move" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate target folder
    const isValidTarget = await validateTargetFolderAdmin(targetFolderId, userId, isPrivate);
    if (!isValidTarget) {
      return NextResponse.json(
        { error: "Target folder not found" },
        { status: 404 }
      );
    }

    // Validate all items belong to the correct user and context
    const userItems = await validateUserItemsAdmin(
      items,
      userId,
      isPrivate,
      {
        id: true,
        type: true,
        path: true,
        parentFolderId: true,
        name: true,
      }
    );

    if (userItems.length !== items.length) {
      return NextResponse.json(
        { error: "Some items not found or unauthorized" },
        { status: 403 }
      );
    }

    // Prevent moving folder into its own descendant
    const hasDescendantConflict = await checkFolderDescendants(
      items,
      targetFolderId,
      userId,
      isPrivate
    );
    if (hasDescendantConflict) {
      return NextResponse.json(
        { error: "Cannot move folder into its own descendant" },
        { status: 400 }
      );
    }

    // Get existing names in the target folder to avoid conflicts
    const existingFiles = await prisma.file.findMany({
      where: {
        parentFolderId: targetFolderId,
        receivedById: userId,
        isAdminOnlyPrivateFile: isPrivate,
      },
      select: { name: true },
    });
    const existingNames = new Set(existingFiles.map(f => f.name).filter((name): name is string => name !== null));

    // Generate unique names for all items being moved
    const uniqueNames = generateUniqueNamesForItems(
      userItems.map(item => ({ name: item.name || "Unnamed" })),
      existingNames
    );

    // Process items and collect S3 operations and DB updates
    const { s3Operations, dbUpdates } = await processItems(
      userItems,
      targetFolderId,
      userId,
      isPrivate,
      session.user.id,
      uniqueNames
    );

    // Execute S3 moves first
    if (s3Operations.length > 0) {
      const s3MoveSuccess = await batchMoveS3Objects(s3Operations);
      if (!s3MoveSuccess) {
        return NextResponse.json(
          { error: "Failed to move files in S3" },
          { status: 500 }
        );
      }
    }

    // Then update database in transaction
    await prisma.$transaction(async (tx) => {
      for (const update of dbUpdates) {
        const updateData: any = {
          parentFolderId: update.newParentFolderId,
        };

        // Only update path for files (folders don't have S3 paths)
        if (update.newPath) {
          updateData.path = update.newPath;
        }

        // Update name if provided
        if (update.newName) {
          updateData.name = update.newName;
        }

        await tx.file.update({
          where: { id: update.id },
          data: updateData,
        });
      }

      // Create notification for the user only if non-private
      if (!isPrivate) {
        await tx.notification.create({
          data: {
            title: `Files moved by admin`,
            message: `${items.length} item(s) moved to ${
              targetFolderId ? "folder" : "root"
            } by ${session.user.name || "Admin"}`,
            userId: userId,
          },
        });
      }
    });

    return NextResponse.json({ success: true, movedCount: items.length });
  } catch (error) {
    console.error("Error in admin bulk move:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
