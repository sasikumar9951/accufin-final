import { NextRequest, NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { batchMoveS3Objects } from "@/lib/s3";
import {
  getDescendantFiles,
  isDescendantFolder,
  generateUserMovePath,
} from "@/lib/file-helpers";
import { generateUniqueNamesForItems } from "@/lib/file-naming-utils";

interface BulkMoveItem {
  id: string;
  type: "file" | "folder";
}

interface BulkMoveRequest {
  items: BulkMoveItem[];
  targetFolderId: string | null;
}

// Validate that folders are not being moved into their descendants
const validateFolderMoveTargets = async (
  items: BulkMoveItem[],
  targetFolderId: string | null,
): Promise<boolean> => {
  if (!targetFolderId) return true;

  for (const item of items) {
    if (item.type === "folder") {
      // constrain the check to current user's folders
      const isDescendant = await isDescendantFolder(item.id, targetFolderId, {
        type: "folder",
      });
      if (isDescendant) {
        return false;
      }
    }
  }
  return true;
};

// Process file move operations
const processFileMove = (
  userItem: any,
  targetFolderId: string | null,
  userId: string,
  s3Operations: { source: string; destination: string }[],
  dbUpdates: {
    id: string;
    newPath: string;
    newParentFolderId: string | null;
    newName?: string;
  }[],
  uniqueName?: string,
) => {
  if (userItem.type !== "folder" && userItem.path) {
    const newPath = generateUserMovePath(userItem.path, targetFolderId, userId);

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
  }
};

// Process folder move operations
const processFolderMove = async (
  userItem: any,
  targetFolderId: string | null,
  userId: string,
  s3Operations: { source: string; destination: string }[],
  dbUpdates: {
    id: string;
    newPath: string;
    newParentFolderId: string | null;
    newName?: string;
  }[],
  uniqueName?: string,
) => {
  if (userItem.type === "folder") {
    const descendantFiles = await getDescendantFiles(userItem.id, {
      uploadedById: userId,
    });

    for (const file of descendantFiles) {
      if (file.path) {
        const newPath = generateUserMovePath(file.path, targetFolderId, userId);

        s3Operations.push({
          source: file.path,
          destination: newPath,
        });

        dbUpdates.push({
          id: file.id,
          newPath: newPath,
          newParentFolderId: file.parentFolderId,
        });
      }
    }

    dbUpdates.push({
      id: userItem.id,
      newPath: "",
      newParentFolderId: targetFolderId,
      newName: uniqueName,
    });
  }
};

// Execute database transaction for move operations
const executeMoveTransaction = async (
  dbUpdates: {
    id: string;
    newPath: string;
    newParentFolderId: string | null;
    newName?: string;
  }[],
  items: BulkMoveItem[],
  targetFolderId: string | null,
  userName: string | null | undefined,
) => {
  await prisma.$transaction(async (tx: any) => {
    for (const update of dbUpdates) {
      const updateData: any = {
        parentFolderId: update.newParentFolderId,
      };

      if (update.newPath) {
        updateData.path = update.newPath;
      }

      if (update.newName) {
        updateData.name = update.newName;
      }

      await tx.file.update({
        where: { id: update.id },
        data: updateData,
      });
    }

    const admins = await tx.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      await tx.notification.createMany({
        data: admins.map((admin: any) => ({
          title: `Files moved by ${userName || "User"}`,
          message: `${items.length} item(s) moved to ${targetFolderId ? "folder" : "root"}`,
          userId: admin.id,
        })),
      });
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);

    const body: BulkMoveRequest = await request.json();
    const { items, targetFolderId } = body;

    if (!items || items.length === 0) {
      return error("No items to move", 400);
    }

    // Validate target folder exists and belongs to user (if not null)
    if (targetFolderId) {
      const targetFolder = await prisma.file.findFirst({
        where: {
          id: targetFolderId,
          type: "folder",
          uploadedById: session.user.id,
        },
      });

      if (!targetFolder) {
        return error("Target folder not found", 404);
      }
    }

    // Validate all items belong to the user
    const itemIds = items.map((item: any) => item.id);
    const userItems = await prisma.file.findMany({
      where: {
        id: { in: itemIds },
        uploadedById: session.user.id,
      },
      select: {
        id: true,
        type: true,
        path: true,
        parentFolderId: true,
        name: true,
      },
    });

    if (userItems.length !== items.length) {
      return error("Some items not found or unauthorized", 403);
    }

    // Prevent moving folder into its own descendant
    const isValid = await validateFolderMoveTargets(items, targetFolderId);
    if (!isValid) {
      return error("Cannot move folder into its own descendant", 400);
    }

    // Get existing names in the target folder to avoid conflicts
    const existingFiles = await prisma.file.findMany({
      where: {
        parentFolderId: targetFolderId,
        uploadedById: session.user.id,
      },
      select: { name: true },
    });
    const existingNames = new Set<string>(
      existingFiles
        .map((f: { name: string | null }) => f.name)
        .filter((name: string | null): name is string => name !== null),
    );

    // Generate unique names for all items being moved
    const uniqueNames = generateUniqueNamesForItems(
      userItems.map((item: any) => ({ name: item.name || "Unnamed" })),
      existingNames,
    );

    // Collect all S3 operations needed
    const s3Operations: { source: string; destination: string }[] = [];
    const dbUpdates: {
      id: string;
      newPath: string;
      newParentFolderId: string | null;
      newName?: string;
    }[] = [];

    // Process each item
    for (let i = 0; i < userItems.length; i++) {
      const userItem = userItems[i];
      const uniqueName = uniqueNames[i];
      processFileMove(
        userItem,
        targetFolderId,
        session.user.id,
        s3Operations,
        dbUpdates,
        uniqueName,
      );

      await processFolderMove(
        userItem,
        targetFolderId,
        session.user.id,
        s3Operations,
        dbUpdates,
        uniqueName,
      );
    }

    // Execute S3 moves first
    if (s3Operations.length > 0) {
      const s3MoveSuccess = await batchMoveS3Objects(s3Operations);
      if (!s3MoveSuccess) {
        return error("Failed to move files in S3", 500);
      }
    }

    // Execute database transaction
    await executeMoveTransaction(
      dbUpdates,
      items,
      targetFolderId,
      session.user.name,
    );

    return NextResponse.json({ success: true, movedCount: items.length });
  } catch (err) {
    console.error("Error in bulk move:", err);
    return error("Internal server error", 500);
  }
}
