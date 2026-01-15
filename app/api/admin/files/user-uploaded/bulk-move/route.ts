import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { batchMoveS3Objects, s3 } from "@/lib/s3";
import { validateTargetFolderUserUploaded, validateUserItemsUserUploaded } from "@/lib/admin-file-utils";
import { getDescendantFiles, isDescendantFolder } from "@/lib/file-helpers";
import { generateUniqueNamesForItems } from "@/lib/file-naming-utils";

interface BulkMoveItem {
  id: string;
  type: "file" | "folder";
}

interface AdminUserUploadedBulkMoveRequest {
  items: BulkMoveItem[];
  targetFolderId: string | null;
  userId: string; // the user whose uploaded files we're managing
}

const generateNewS3Path = (
  originalPath: string,
  newFolderId: string | null,
  userId: string
): string => {
  if (!originalPath) return "";
  const parts = originalPath.split("/");
  const filename = parts.at(-1) ?? "";
  return s3.getUserSendingFilePath(userId, filename, newFolderId || undefined);
};

// use shared helpers from file-helpers instead of reimplementing

// Validate target folder exists and belongs to the user
// (moved to shared utils)

// Validate user items and check authorization
// (moved to shared utils)

// Check if target folder is a descendant of any folder being moved
const checkFolderDescendants = async (
  items: BulkMoveItem[],
  targetFolderId: string | null,
  userId: string
): Promise<boolean> => {
  if (!targetFolderId) return false;
  const whereExtra = { uploadedById: userId, type: "folder" } as const;
  for (const item of items) {
    if (item.type === "folder") {
      const isDesc = await isDescendantFolder(item.id, targetFolderId, whereExtra);
      if (isDesc) return true;
    }
  }
  return false;
};

// Helper function to check if target is descendant of a folder
// descendant check replaced with shared helper above

// Process items and generate S3 operations and DB updates
const processItemsForMove = async (
  userItems: any[],
  targetFolderId: string | null,
  userId: string,
  uniqueNames: string[]
) => {
  const s3Operations: { source: string; destination: string }[] = [];
  const dbUpdates: { id: string; newPath: string; newParentFolderId: string | null; newName?: string }[] = [];

  for (let i = 0; i < userItems.length; i++) {
    const userItem = userItems[i];
    const uniqueName = uniqueNames[i];
    if (userItem.type !== "folder" && userItem.path) {
      const newPath = generateNewS3Path(
        userItem.path,
        targetFolderId,
        userId
      );
      s3Operations.push({ source: userItem.path, destination: newPath });
      dbUpdates.push({ id: userItem.id, newPath, newParentFolderId: targetFolderId, newName: uniqueName });
    } else if (userItem.type === "folder") {
      const descendantFiles = await getDescendantFiles(userItem.id, { uploadedById: userId });
      for (const file of descendantFiles) {
        if (file.path) {
          const newPath = generateNewS3Path(
            file.path,
            targetFolderId,
            userId
          );
          s3Operations.push({ source: file.path, destination: newPath });
          dbUpdates.push({ id: file.id, newPath, newParentFolderId: file.parentFolderId });
        }
      }
      dbUpdates.push({ id: userItem.id, newPath: "", newParentFolderId: targetFolderId, newName: uniqueName });
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

    const body: AdminUserUploadedBulkMoveRequest = await request.json();
    const { items, targetFolderId, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items to move" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Validate target folder
    const isValidTarget = await validateTargetFolderUserUploaded(targetFolderId, userId);
    if (!isValidTarget) {
      return NextResponse.json({ error: "Target folder not found" }, { status: 404 });
    }

    // Validate user items
    const userItems = await validateUserItemsUserUploaded(items, userId, {
      id: true,
      type: true,
      path: true,
      parentFolderId: true,
    });

    if (userItems.length !== items.length) {
      return NextResponse.json(
        { error: "Some items not found or unauthorized" },
        { status: 403 }
      );
    }

    // Check for folder descendant conflicts
    const hasDescendantConflict = await checkFolderDescendants(items, targetFolderId, userId);
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
        uploadedById: userId,
      },
      select: { name: true },
    });
    const existingNames = new Set(existingFiles.map(f => f.name).filter((name): name is string => name !== null));

    // Generate unique names for all items being moved
    const uniqueNames = generateUniqueNamesForItems(
      userItems.map(item => ({ name: item.name || "Unnamed" })),
      existingNames
    );

    // Process items for move
    const { s3Operations, dbUpdates } = await processItemsForMove(
      userItems,
      targetFolderId,
      userId,
      uniqueNames
    );

    if (s3Operations.length > 0) {
      const ok = await batchMoveS3Objects(s3Operations);
      if (!ok) {
        return NextResponse.json({ error: "Failed to move files in S3" }, { status: 500 });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const update of dbUpdates) {
        const data: any = { parentFolderId: update.newParentFolderId };
        if (update.newPath) data.path = update.newPath;
        if (update.newName) data.name = update.newName;
        await tx.file.update({ where: { id: update.id }, data });
      }
    });

    return NextResponse.json({ success: true, movedCount: items.length });
  } catch (error) {
    console.error("Error in admin user-uploaded bulk move:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


