import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { batchCopyS3Objects } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import {
  calculateTotalStorageKB,
  parseFileSizeToKB,
  validateTargetFolderAdmin,
  validateUserItemsAdmin,
} from "@/lib/admin-file-utils";
import { generateAdminCopyPath } from "@/lib/file-bulk";
import { generateUniqueNamesForItems } from "@/lib/file-naming-utils";

interface BulkCopyItem {
  id: string;
  type: "file" | "folder";
}

interface AdminBulkCopyRequest {
  items: BulkCopyItem[];
  targetFolderId: string | null;
  userId: string; // The user whose files we're managing
  isPrivate: boolean; // Whether this is for private or response files
}

// Generate new S3 path for copied file (admin context)
// path generation moved to lib/file-bulk

// Get all descendant files and folders in the correct order
const getAllDescendantItems = async (
  folderId: string,
  userId: string,
  isPrivate: boolean
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
      receivedById: userId,
      isAdminOnlyPrivateFile: isPrivate,
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
      const descendants = await getAllDescendantItems(child.id, userId, isPrivate);
      allFolders.push(...descendants.folders);
      allFiles.push(...descendants.files);
    } else {
      allFiles.push(child);
    }
  }

  return { files: allFiles, folders: allFolders };
};

// Recursively get all descendant files for a folder (admin context)
const getAllDescendantFiles = async (
  folderId: string,
  userId: string,
  isPrivate: boolean
): Promise<
  {
    id: string;
    name: string | null;
    path: string | null;
    size: string | null;
    type: string | null;
    parentFolderId: string | null;
    folderName: string | null;
  }[]
> => {
  const whereClause: any = {
    parentFolderId: folderId,
  };

  if (isPrivate) {
    whereClause.isAdminOnlyPrivateFile = true;
    whereClause.receivedById = userId;
  } else {
    whereClause.isAdminOnlyPrivateFile = false;
    whereClause.receivedById = userId;
  }

  const children = await prisma.file.findMany({
    where: whereClause,
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

  let allFiles: {
    id: string;
    name: string | null;
    path: string | null;
    size: string | null;
    type: string | null;
    parentFolderId: string | null;
    folderName: string | null;
  }[] = [];

  for (const child of children) {
    if (child.type === "folder") {
      // Recursively get descendants of this folder
      const descendants = await getAllDescendantFiles(
        child.id,
        userId,
        isPrivate
      );
      allFiles = allFiles.concat(descendants);
    } else {
      // This is a file
      allFiles.push(child);
    }
  }

  return allFiles;
};

// Build folder ID mapping without creating database entries (admin context)
const buildFolderIdMap = async (
  originalFolderId: string,
  userId: string,
  isPrivate: boolean,
  folderIdMap: Map<string, string> // Map original folder IDs to new folder IDs
): Promise<void> => {
  const whereClause: any = {
    parentFolderId: originalFolderId,
    type: "folder",
  };

  if (isPrivate) {
    whereClause.isAdminOnlyPrivateFile = true;
    whereClause.receivedById = userId;
  } else {
    whereClause.isAdminOnlyPrivateFile = false;
    whereClause.receivedById = userId;
  }

  // Get all direct children of this folder
  const children = await prisma.file.findMany({
    where: whereClause,
    select: {
      id: true,
    },
  });

  // Generate new IDs for each child folder
  for (const childFolder of children) {
    const newFolderId = uuidv4();
    folderIdMap.set(childFolder.id, newFolderId);

    // Recursively process subfolders
    await buildFolderIdMap(childFolder.id, userId, isPrivate, folderIdMap);
  }
};

// Get folder creation data for database transaction (admin context)
const getFolderCreationData = async (
  originalFolderId: string,
  newParentFolderId: string | null,
  userId: string,
  adminId: string,
  isPrivate: boolean,
  folderIdMap: Map<string, string>
): Promise<any[]> => {
  const folderCreations: any[] = [];

  const whereClause: any = {
    parentFolderId: originalFolderId,
    type: "folder",
  };

  if (isPrivate) {
    whereClause.isAdminOnlyPrivateFile = true;
    whereClause.receivedById = userId;
  } else {
    whereClause.isAdminOnlyPrivateFile = false;
    whereClause.receivedById = userId;
  }

  // Get all direct children of this folder
  const children = await prisma.file.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      folderName: true,
    },
  });

  // Create folder data for each child folder
  for (const childFolder of children) {
    const newFolderId = folderIdMap.get(childFolder.id);
    if (!newFolderId) continue;

    folderCreations.push({
      id: newFolderId,
      name: childFolder.name || "Unnamed Folder",
      type: "folder",
      parentFolderId: newParentFolderId,
      uploadedById: adminId,
      receivedById: userId,
      isAdminOnlyPrivateFile: isPrivate,
      folderName: childFolder.folderName,
    });

    // Recursively get subfolder data
    const subfolderData = await getFolderCreationData(
      childFolder.id,
      newFolderId,
      userId,
      adminId,
      isPrivate,
      folderIdMap
    );
    folderCreations.push(...subfolderData);
  }

  return folderCreations;
};

// Helper function to check storage limit
const checkStorageLimit = async (
  userId: string,
  dbCreations: any[]
): Promise<{ success: boolean; error?: string }> => {
  const totalAddedKB = calculateTotalStorageKB(dbCreations);

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true, maxStorageLimit: true },
  });

  if (targetUser?.maxStorageLimit && targetUser.maxStorageLimit > 0) {
    const projected = (targetUser.storageUsed || 0) + totalAddedKB;
    if (projected >= targetUser.maxStorageLimit) {
      return {
        success: false,
        error: "Storage limit reached. Cannot copy items for this user.",
      };
    }
  }

  return { success: true };
};

// Helper function to process file copying
const processFileCopy = (
  userItem: any,
  targetFolderId: string | null,
  userId: string,
  isPrivate: boolean,
  adminId: string,
  uniqueName: string
) => {
  const newFileId = uuidv4();
  const newPath = generateAdminCopyPath(
    userItem.path,
    targetFolderId,
    userId,
    isPrivate,
    adminId,
    newFileId
  );

  return {
    s3Operation: {
      source: userItem.path,
      destination: newPath,
    },
    dbCreation: {
      id: newFileId,
      path: newPath,
      name: uniqueName,
      size: userItem.size,
      type: userItem.type,
      parentFolderId: targetFolderId,
      uploadedById: adminId,
      receivedById: userId,
      isAdminOnlyPrivateFile: isPrivate,
      folderName: userItem.folderName,
    },
  };
};

// Helper function to process folder copying
const processFolderCopy = async (
  userItem: any,
  targetFolderId: string | null,
  userId: string,
  isPrivate: boolean,
  adminId: string,
  uniqueName: string
) => {
  const newFolderId = uuidv4();
  const folderIdMap = new Map<string, string>();
  folderIdMap.set(userItem.id, newFolderId);

  const s3Operations: { source: string; destination: string }[] = [];
  const dbCreations: any[] = [];

  // Create the main folder
  dbCreations.push({
    id: newFolderId,
    name: uniqueName,
    type: "folder",
    parentFolderId: targetFolderId,
    uploadedById: adminId,
    receivedById: userId,
    isAdminOnlyPrivateFile: isPrivate,
    folderName: userItem.folderName,
  });

  // Get all descendant items (folders and files) in the correct order
  const { files: descendantFiles, folders: descendantFolders } = await getAllDescendantItems(userItem.id, userId, isPrivate);

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
      uploadedById: adminId,
      receivedById: userId,
      isAdminOnlyPrivateFile: isPrivate,
      folderName: folder.folderName,
    });
  }

  // Then, create all files with correct parent folder IDs
  for (const file of descendantFiles) {
    if (file.path) {
      const newFileId = uuidv4();
      const originalParentId = file.parentFolderId;
      const newParentId = originalParentId ? folderIdMap.get(originalParentId) : newFolderId;

      const newPath = generateAdminCopyPath(
        file.path,
        newParentId || null,
        userId,
        isPrivate,
        adminId,
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
        uploadedById: adminId,
        receivedById: userId,
        isAdminOnlyPrivateFile: isPrivate,
        folderName: file.folderName,
      });
    }
  }

  return { s3Operations, dbCreations };
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AdminBulkCopyRequest = await request.json();
    const { items, targetFolderId, userId, isPrivate } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items to copy" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate target folder exists and belongs to correct context (if not null)
    const targetFolderValid = await validateTargetFolderAdmin(
      targetFolderId,
      userId,
      isPrivate
    );
    if (!targetFolderValid) {
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
        size: true,
        folderName: true,
      }
    );
    if (userItems.length !== items.length) {
      return NextResponse.json(
        { error: "Some items not found or unauthorized" },
        { status: 403 }
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

    // Process each item
    for (let i = 0; i < userItems.length; i++) {
      const userItem = userItems[i];
      const uniqueName = uniqueNames[i];

      if (userItem.type !== "folder" && userItem.path) {
        // Handle file copy
        const { s3Operation, dbCreation } = processFileCopy(
          userItem,
          targetFolderId,
          userId,
          isPrivate,
          session.user.id,
          uniqueName
        );
        s3Operations.push(s3Operation);
        dbCreations.push(dbCreation);
      } else if (userItem.type === "folder") {
        // Handle folder copy
        const folderResult = await processFolderCopy(
          userItem,
          targetFolderId,
          userId,
          isPrivate,
          session.user.id,
          uniqueName
        );
        s3Operations.push(...folderResult.s3Operations);
        dbCreations.push(...folderResult.dbCreations);
      }
    }

    // Check storage limit before proceeding
    const storageCheck = await checkStorageLimit(userId, dbCreations);
    if (!storageCheck.success) {
      return NextResponse.json(
        { error: storageCheck.error },
        { status: 403 }
      );
    }

    // Execute S3 copies first
    if (s3Operations.length > 0) {
      const s3CopySuccess = await batchCopyS3Objects(s3Operations);
      if (!s3CopySuccess) {
        return NextResponse.json(
          { error: "Failed to copy files in S3" },
          { status: 500 }
        );
      }
    }

    // Then create new database entries in transaction
    await prisma.$transaction(
      async (tx) => {
        // First create all folders (they have no parentFolderId dependencies outside this transaction)
        const folderCreations = dbCreations.filter(
          (item) => item.type === "folder"
        );
        const fileCreations = dbCreations.filter(
          (item) => item.type !== "folder"
        );

        // Use createMany for better performance, but chunk large operations
        const BATCH_SIZE = 100; // Process in chunks of 100 items

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

            // Update target user's storageUsed (receivedById) for non-folder files
            const kbSum = batch.reduce((sum, c) => {
              if (c.type === "folder") return sum;
              return sum + parseFileSizeToKB(c.size || "");
            }, 0);
            if (kbSum > 0) {
              await tx.user.update({
                where: { id: userId },
                data: { storageUsed: { increment: kbSum } },
              });
            }
          }
        }

        // Create notification for the user only if non-private
        if (!isPrivate) {
          await tx.notification.create({
            data: {
              title: `Files copied by admin`,
              message: `${items.length} item(s) copied to ${
                targetFolderId ? "folder" : "root"
              } by ${session.user.name || "Admin"}`,
              userId: userId,
            },
          });
        }
      },
      {
        timeout: 30000, // 30 second timeout for large copy operations
      }
    );

    return NextResponse.json({ success: true, copiedCount: items.length });
  } catch (error) {
    console.error("Error in admin bulk copy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
