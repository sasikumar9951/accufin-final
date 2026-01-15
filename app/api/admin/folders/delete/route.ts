import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { deleteFileFromS3, deleteFolderFromS3, s3 } from "@/lib/s3";
import { getAllDescendantIds } from "@/lib/server-folders";

// Parse file size to KB for storage tracking
const parseFileSizeToKB = (sizeStr: string | null): number => {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "KB") return value;
  if (unit === "MB") return value * 1024;
  if (unit === "GB") return value * 1024 * 1024;
  if (unit === "B" || unit === "BYTES") return value / 1024;
  return 0;
};

// DELETE: Delete a folder by ID and all its descendants
// Body: { folderId: string, selectedUserId: string, isPrivate?: boolean }
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const body = await request.json();
    const { folderId, selectedUserId, isPrivate } = body as {
      folderId?: string;
      selectedUserId?: string;
      isPrivate?: boolean;
    };

    if (!folderId || !selectedUserId) return error("Missing fields", 400);

    const scopeFilter: any = {
      receivedById: selectedUserId,
    };
    if (typeof isPrivate === "boolean") {
      scopeFilter.isAdminOnlyPrivateFile = isPrivate;
    }

    // Verify the folder exists and belongs to the user
    const folder = await prisma.file.findFirst({
      where: {
        id: folderId,
        type: "folder",
        ...scopeFilter,
      },
    });

    if (!folder) return error("Folder not found", 404);

    // Get all files in this folder and its subfolders recursively
    const allFileIds = await getAllDescendantIds(folderId, scopeFilter);

    // Get all files to delete from S3 and calculate storage to free
    const filesToDelete = await prisma.file.findMany({
      where: {
        id: { in: allFileIds },
        ...scopeFilter,
      },
      select: { path: true, name: true, size: true, type: true },
    });

    // Calculate total storage to decrement (only for actual files, not folders)
    const totalStorageKB = filesToDelete.reduce((sum, f) => {
      if (f.type !== "folder") {
        return sum + parseFileSizeToKB(f.size);
      }
      return sum;
    }, 0);

    // Delete from database and update storage
    await prisma.$transaction(async (tx) => {
      // Delete all files and folders
      await tx.file.deleteMany({
        where: {
          id: { in: allFileIds },
          ...scopeFilter,
        },
      });

      // Decrement storage for the user (receivedById is the actual user, not admin)
      if (totalStorageKB > 0) {
        await tx.user.update({
          where: { id: selectedUserId },
          data: { storageUsed: { decrement: totalStorageKB } },
        });
      }
    });

    // Delete from S3 after successful DB deletion
    try {
      // Delete individual files first
      for (const fileRecord of filesToDelete) {
        if (fileRecord.path) {
          await deleteFileFromS3(fileRecord.path);
        }
      }

      // Also try to delete the folder path from S3 (in case there are any remaining files)
      const s3FolderPath = s3.getUserSendingFilePath(
        selectedUserId,
        "",
        folderId
      );
      await deleteFolderFromS3(s3FolderPath);
    } catch (s3Error) {
      console.error("Error deleting folder from S3:", s3Error);
      // Don't fail the request if S3 deletion fails
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("Admin folder delete error:", e);
    return error("Internal server error", 500);
  }
}

// POST: Delete a logical folder (path-based) and its descendants - LEGACY SUPPORT
// Body: { selectedUserId: string, parentPath: string, folderName: string, isPrivate?: boolean }
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const body = await request.json();
    const { selectedUserId, parentPath, folderName, isPrivate } = body as {
      selectedUserId?: string;
      parentPath?: string;
      folderName?: string;
      isPrivate?: boolean;
    };

    if (!selectedUserId || !folderName) return error("Missing fields", 400);
    if (folderName.includes("/")) {
      return error("Invalid folder name", 400);
    }

    const full = parentPath ? `${parentPath}/${folderName}` : folderName;
    const scopeFilter: any = {
      receivedById: selectedUserId,
    };
    if (typeof isPrivate === "boolean") {
      scopeFilter.isAdminOnlyPrivateFile = isPrivate;
    }

    // Get all files in this folder before deleting from DB and calculate storage
    const filesToDelete = await prisma.file.findMany({
      where: {
        ...scopeFilter,
        folderName: { startsWith: full },
      },
      select: {
        path: true,
        folderName: true,
        name: true,
        size: true,
        type: true,
      },
    });

    // Calculate total storage to decrement (only for actual files, not folders)
    const totalStorageKB = filesToDelete.reduce((sum, f) => {
      if (f.type !== "folder") {
        return sum + parseFileSizeToKB(f.size);
      }
      return sum;
    }, 0);

    await prisma.$transaction(async (tx) => {
      await tx.file.deleteMany({
        where: {
          ...scopeFilter,
          folderName: { startsWith: full },
        },
      });
      // delete a potential folder record itself
      await tx.file.deleteMany({
        where: {
          ...scopeFilter,
          type: "folder",
          name: folderName,
          folderName: parentPath || "",
        },
      });

      // Decrement storage for the user
      if (totalStorageKB > 0) {
        await tx.user.update({
          where: { id: selectedUserId },
          data: { storageUsed: { decrement: totalStorageKB } },
        });
      }
    });

    // Delete from S3 after successful DB deletion
    try {
      // Delete individual files first
      for (const fileRecord of filesToDelete) {
        if (fileRecord.path) {
          await deleteFileFromS3(fileRecord.path);
        }
      }

      // Also try to delete the folder path from S3 (in case there are any remaining files)
      // Both private and response files use getUserSendingFilePath based on FileManagement component
      const s3FolderPath = s3.getUserSendingFilePath(selectedUserId, "", full);
      await deleteFolderFromS3(s3FolderPath);
    } catch (s3Error) {
      console.error("Error deleting folder from S3:", s3Error);
      // Don't fail the request if S3 deletion fails
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("Admin folder delete error:", e);
    return error("Internal server error", 500);
  }
}
