import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { batchCopyS3Objects } from "@/lib/s3";
import {
  calculateTotalStorageKB,
  validateTargetFolderUserUploaded,
  validateUserItemsUserUploaded,
} from "@/lib/admin-file-utils";
import { generateUserCopyPath } from "@/lib/file-bulk";
import { v4 as uuidv4 } from "uuid";
import { generateUniqueNamesForItems } from "@/lib/file-naming-utils";

interface BulkCopyItem {
  id: string;
  type: "file" | "folder";
}

interface AdminUserUploadedBulkCopyRequest {
  items: BulkCopyItem[];
  targetFolderId: string | null;
  userId: string; // the user whose uploaded files we're managing
}

// path generation moved to lib/file-bulk

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

const getAllDescendantFiles = async (
  folderId: string,
  userId: string
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
      const descendants = await getAllDescendantFiles(child.id, userId);
      allFiles = allFiles.concat(descendants);
    } else {
      allFiles.push(child);
    }
  }

  return allFiles;
};

// (validators moved to shared utils)

// Process files for copying
const processFilesForCopy = async (
  userItems: any[],
  targetFolderId: string | null,
  userId: string,
  uniqueNames: string[]
) => {
  const s3Operations: { source: string; destination: string }[] = [];
  const dbCreates: any[] = [];
  const folderIdMap = new Map<string, string>();

  for (let i = 0; i < userItems.length; i++) {
    const userItem = userItems[i];
    const uniqueName = uniqueNames[i];

    if (userItem.type !== "folder" && userItem.path) {
      await processSingleFile(userItem, targetFolderId, userId, s3Operations, dbCreates, uniqueName);
    } else if (userItem.type === "folder") {
      await processFolderWithDescendants(
        userItem,
        targetFolderId,
        userId,
        folderIdMap,
        s3Operations,
        dbCreates,
        uniqueName
      );
    }
  }
  
  return { s3Operations, dbCreates };
};

// Process a single file for copying
const processSingleFile = async (
  userItem: any,
  targetFolderId: string | null,
  userId: string,
  s3Operations: { source: string; destination: string }[],
  dbCreates: any[],
  uniqueName: string
) => {
  const newFileId = uuidv4();
  const newPath = generateUserCopyPath(
    userItem.path,
    targetFolderId,
    userId,
    newFileId
  );
  s3Operations.push({ source: userItem.path, destination: newPath });
  dbCreates.push({
    id: newFileId,
    name: uniqueName,
    size: userItem.size,
    type: userItem.type,
    path: newPath,
    parentFolderId: targetFolderId,
    uploadedById: userId,
  });
};

// Process a folder and its descendants for copying
const processFolderWithDescendants = async (
  userItem: any,
  targetFolderId: string | null,
  userId: string,
  folderIdMap: Map<string, string>,
  s3Operations: { source: string; destination: string }[],
  dbCreates: any[],
  uniqueName: string
) => {
  const newFolderId = uuidv4();
  folderIdMap.set(userItem.id, newFolderId);
  
  // Create the main folder
  dbCreates.push({
    id: newFolderId,
    name: uniqueName,
    type: "folder",
    parentFolderId: targetFolderId,
    uploadedById: userId,
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

    dbCreates.push({
      id: newSubFolderId,
      name: folder.name || "Unnamed Folder",
      type: "folder",
      parentFolderId: newParentId,
      uploadedById: userId,
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

      dbCreates.push({
        id: newFileId,
        name: file.name || "Unnamed File",
        size: file.size,
        type: file.type,
        path: newPath,
        parentFolderId: newParentId,
        uploadedById: userId,
      });
    }
  }
};


// Check storage limits before copying
const checkStorageLimits = async (
  userId: string,
  totalAddedKB: number
): Promise<boolean> => {
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageUsed: true, maxStorageLimit: true },
  });
  
  if (targetUser?.maxStorageLimit && targetUser.maxStorageLimit > 0) {
    const projected = (targetUser.storageUsed || 0) + totalAddedKB;
    return projected < targetUser.maxStorageLimit;
  }
  
  return true;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AdminUserUploadedBulkCopyRequest = await request.json();
    const { items, targetFolderId, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items to copy" }, { status: 400 });
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
      name: true,
      size: true,
    });

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
        uploadedById: userId,
      },
      select: { name: true },
    });
    const existingNames = new Set(existingFiles.map(f => f.name).filter((name): name is string => name !== null));

    // Generate unique names for all items being copied
    const uniqueNames = generateUniqueNamesForItems(
      userItems.map(item => ({ name: item.name || "Unnamed" })),
      existingNames
    );

    // Process files for copying
    const { s3Operations, dbCreates } = await processFilesForCopy(
      userItems,
      targetFolderId,
      userId,
      uniqueNames
    );

    // Calculate total storage and check limits
    const totalAddedKB = calculateTotalStorageKB(dbCreates);
    const withinLimits = await checkStorageLimits(userId, totalAddedKB);
    
    if (!withinLimits) {
      return NextResponse.json(
        { error: "Storage limit reached. Cannot copy items for this user." },
        { status: 403 }
      );
    }

    if (s3Operations.length > 0) {
      const ok = await batchCopyS3Objects(s3Operations);
      if (!ok) {
        return NextResponse.json({ error: "Failed to copy files in S3" }, { status: 500 });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const create of dbCreates) {
        await tx.file.create({ data: create });
      }
      
      // Calculate and update storage usage
      const kbSum = calculateTotalStorageKB(dbCreates);
      if (kbSum > 0) {
        const ownerId = dbCreates.find((c) => c.uploadedById)?.uploadedById;
        if (ownerId) {
          await tx.user.update({
            where: { id: ownerId },
            data: { storageUsed: { increment: kbSum } },
          });
        }
      }
    });

    return NextResponse.json({ success: true, copiedCount: items.length });
  } catch (error) {
    console.error("Error in admin user-uploaded bulk copy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


