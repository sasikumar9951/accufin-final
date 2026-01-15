import { NextRequest, NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { batchCopyS3Objects } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import { generateUserCopyPath } from "@/lib/file-bulk";
import { calculateTotalStorageKB } from "@/lib/admin-file-utils";
import { generateUniqueNamesForItems } from "@/lib/file-naming-utils";

interface BulkCopyItem {
  id: string;
  type: "file" | "folder";
}

interface BulkCopyRequest {
  items: BulkCopyItem[];
  targetFolderId: string | null;
}

// path generation moved to lib/file-bulk


// Build folder ID mapping without creating database entries
const buildFolderIdMap = async (
  originalFolderId: string,
  userId: string,
  folderIdMap: Map<string, string> // Map original folder IDs to new folder IDs
): Promise<void> => {
  // Get all direct children of this folder
  const children = await prisma.file.findMany({
    where: {
      parentFolderId: originalFolderId,
      uploadedById: userId,
      type: "folder",
    },
    select: {
      id: true,
    },
  });

  // Generate new IDs for each child folder
  for (const childFolder of children) {
    const newFolderId = uuidv4();
    folderIdMap.set(childFolder.id, newFolderId);

    // Recursively process subfolders
    await buildFolderIdMap(childFolder.id, userId, folderIdMap);
  }
};

// Get all descendant files and folders in the correct order
const getAllDescendantItems = async (
  folderId: string,
  userId: string
): Promise<{
  files: any[];
  folders: any[];
}> => {
  const allFiles: any[] = [];
  const allFolders: any[] = [];

  // Get all direct children
  const children = await prisma.file.findMany({
    where: {
      parentFolderId: folderId,
      uploadedById: userId,
    },
    select: {
      id: true,
      name: true,
      path: true,
      size: true,
      type: true,
      parentFolderId: true,
      folderName: true,
    },
  });

  for (const child of children) {
    if (child.type === "folder") {
      allFolders.push(child);
      // Recursively get descendants
      const descendants = await getAllDescendantItems(child.id, userId);
      allFolders.push(...descendants.folders);
      allFiles.push(...descendants.files);
    } else {
      allFiles.push(child);
    }
  }

  return { files: allFiles, folders: allFolders };
};


// Process file copy operations
const processFileCopy = (
  userItem: any,
  targetFolderId: string | null,
  userId: string,
  adminId: string,
  s3Operations: { source: string; destination: string }[],
  dbCreations: any[],
  uniqueName: string
) => {
  if (userItem.type !== "folder" && userItem.path) {
    const newFileId = uuidv4();
    const newPath = generateUserCopyPath(
      userItem.path,
      targetFolderId,
      userId,
      newFileId
    );

    s3Operations.push({
      source: userItem.path,
      destination: newPath,
    });

    dbCreations.push({
      id: newFileId,
      path: newPath,
      name: uniqueName,
      size: userItem.size,
      type: userItem.type,
      parentFolderId: targetFolderId,
      uploadedById: userId,
      receivedById: adminId,
      isAdminOnlyPrivateFile: false,
      folderName: userItem.folderName,
    });
  }
};

// Process folder copy operations
const processFolderCopy = async (
  userItem: any,
  targetFolderId: string | null,
  userId: string,
  adminId: string,
  s3Operations: { source: string; destination: string }[],
  dbCreations: any[],
  folderIdMap: Map<string, string>,
  uniqueName: string
) => {
  if (userItem.type === "folder") {
    const newFolderId = uuidv4();
    folderIdMap.set(userItem.id, newFolderId);

    // Create the main folder
    dbCreations.push({
      id: newFolderId,
      name: uniqueName,
      type: "folder",
      parentFolderId: targetFolderId,
      uploadedById: userId,
      receivedById: adminId,
      isAdminOnlyPrivateFile: false,
      folderName: userItem.folderName,
    });

    // Get all descendant items (folders and files) in the correct order
    const { files: descendantFiles, folders: descendantFolders } = await getAllDescendantItems(userItem.id, userId);

    // First, create all folders in the correct hierarchy
    for (const folder of descendantFolders) {
      const newSubFolderId = uuidv4();
      folderIdMap.set(folder.id, newSubFolderId);
      
      // Find the correct parent folder ID
      const originalParentId = folder.parentFolderId;
      const newParentId = originalParentId ? folderIdMap.get(originalParentId) : newFolderId;

      dbCreations.push({
        id: newSubFolderId,
        name: folder.name || "Unnamed Folder",
        type: "folder",
        parentFolderId: newParentId,
        uploadedById: userId,
        receivedById: adminId,
        isAdminOnlyPrivateFile: false,
        folderName: folder.folderName,
      });
    }

    // Then, create all files with correct parent folder IDs
    for (const file of descendantFiles) {
      if (file.path) {
        const newFileId = uuidv4();
        const originalParentId = file.parentFolderId;
        const newParentId = originalParentId ? folderIdMap.get(originalParentId) : newFolderId;

        const newPath = generateUserCopyPath(
          file.path,
          newParentId || null,
          userId,
          newFileId
        );

        s3Operations.push({
          source: file.path,
          destination: newPath,
        });

        dbCreations.push({
          id: newFileId,
          path: newPath,
          name: file.name || "Unnamed File",
          size: file.size,
          type: file.type,
          parentFolderId: newParentId,
          uploadedById: userId,
          receivedById: adminId,
          isAdminOnlyPrivateFile: false,
          folderName: file.folderName,
        });
      }
    }
  }
};

// Check if storage limit is exceeded
const checkStorageLimit = async (
  userId: string,
  dbCreations: any[]
): Promise<boolean> => {
  const totalAddedKB = calculateTotalStorageKB(dbCreations);

  const userForLimit = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true, maxStorageLimit: true },
  });

  if (userForLimit?.maxStorageLimit && userForLimit.maxStorageLimit > 0) {
    const projected = (userForLimit.storageUsed || 0) + totalAddedKB;
    return projected >= userForLimit.maxStorageLimit;
  }

  return false;
};

// Execute database transaction for copy operations
const executeCopyTransaction = async (
  dbCreations: any[],
  userId: string
) => {
  await prisma.$transaction(
    async (tx) => {
      const folderCreations = dbCreations.filter((item) => item.type === "folder");
      const fileCreations = dbCreations.filter((item) => item.type !== "folder");
      const BATCH_SIZE = 100;

      if (folderCreations.length > 0) {
        for (let i = 0; i < folderCreations.length; i += BATCH_SIZE) {
          const batch = folderCreations.slice(i, i + BATCH_SIZE);
          await tx.file.createMany({
            data: batch.map((creation) => ({
              ...creation,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          });
        }
      }

      if (fileCreations.length > 0) {
        for (let i = 0; i < fileCreations.length; i += BATCH_SIZE) {
          const batch = fileCreations.slice(i, i + BATCH_SIZE);
          await tx.file.createMany({
            data: batch.map((creation) => ({
              ...creation,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          });

          const kbSum = calculateTotalStorageKB(batch);

          if (kbSum > 0) {
            await tx.user.update({
              where: { id: userId },
              data: { storageUsed: { increment: kbSum } },
            });
          }
        }
      }

      const admins = await tx.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
      });

      if (admins.length > 0) {
        const userName = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        await tx.notification.createMany({
          data: admins.map((admin) => ({
            title: `Files copied by ${userName?.name || "User"}`,
            message: `${fileCreations.length + folderCreations.length} item(s) copied`,
            userId: admin.id,
          })),
        });
      }
    },
    { timeout: 30000 }
  );
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);

    const body: BulkCopyRequest = await request.json();
    const { items, targetFolderId } = body;

    if (!items || items.length === 0) return error("No items to copy", 400);

    // Validate target folder exists and belongs to user (if not null)
    if (targetFolderId) {
      const targetFolder = await prisma.file.findFirst({
        where: {
          id: targetFolderId,
          type: "folder",
          uploadedById: session.user.id,
        },
      });

      if (!targetFolder) return error("Target folder not found", 404);
    }

    // Validate all items belong to the user
    const itemIds = items.map((item) => item.id);
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
        size: true,
        folderName: true,
      },
    });

    if (userItems.length !== items.length) return error("Some items not found or unauthorized", 403);

    // Get admin user for receivedById
    const admin = await prisma.user.findFirst({
      where: { isAdmin: true },
    });
    if (!admin) return error("Admin not found", 404);

    // Get existing names in the target folder to avoid conflicts
    const existingFiles = await prisma.file.findMany({
      where: {
        parentFolderId: targetFolderId,
        uploadedById: session.user.id,
      },
      select: { name: true },
    });
    const existingNames = new Set(
      existingFiles
        .map((f) => f.name)
        .filter((name): name is string => typeof name === "string" && name.length > 0)
    );

    // Generate unique names for all items being copied
    const uniqueNames = generateUniqueNamesForItems(
      userItems.map(item => ({ name: item.name || "Unnamed" })),
      existingNames
    );

    // Collect all S3 operations and DB operations needed
    const s3Operations: { source: string; destination: string }[] = [];
    const dbCreations: any[] = [];
    const folderIdMap = new Map<string, string>();

    // Process each item
    for (let i = 0; i < userItems.length; i++) {
      const userItem = userItems[i];
      const uniqueName = uniqueNames[i];

      processFileCopy(
        userItem,
        targetFolderId,
        session.user.id,
        admin.id,
        s3Operations,
        dbCreations,
        uniqueName
      );

      await processFolderCopy(
        userItem,
        targetFolderId,
        session.user.id,
        admin.id,
        s3Operations,
        dbCreations,
        folderIdMap,
        uniqueName
      );
    }

    // Check storage limit
    const limitExceeded = await checkStorageLimit(session.user.id, dbCreations);
    if (limitExceeded) return error("Storage limit reached. Cannot copy items.", 403);

    // Execute S3 copies first
    if (s3Operations.length > 0) {
      const s3CopySuccess = await batchCopyS3Objects(s3Operations);
      if (!s3CopySuccess) return error("Failed to copy files in S3", 500);
    }

    // Execute database transaction
    await executeCopyTransaction(dbCreations, session.user.id);

    return NextResponse.json({ success: true, copiedCount: items.length });
  } catch (err) {
    console.error("Error in bulk copy:", err);
    return error("Internal server error", 500);
  }
}
