import { NextRequest, NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { deleteFileFromS3, deleteFolderFromS3,s3 } from "@/lib/s3";
import { getAllDescendantIds } from "@/lib/server-folders";

// DELETE: Delete a folder by ID and all its descendants
// Body: { folderId: string }
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);
    const body = await request.json();
    const { folderId } = body as { folderId?: string };

    if (!folderId) return error("Missing folderId", 400);

    // Verify the folder belongs to the user
    const folder = await prisma.file.findFirst({
      where: {
        id: folderId,
        type: "folder",
        uploadedById: session.user.id,
      },
    });

    if (!folder) return error("Folder not found", 404);

    // Get all files in this folder and its subfolders recursively
    const allFileIds = await getAllDescendantIds(folderId, {
      uploadedById: session.user.id,
    });

    // Get all files to delete from S3
    const filesToDelete = await prisma.file.findMany({
      where: {
        id: { in: allFileIds },
        uploadedById: session.user.id,
      },
      select: { path: true, name: true },
    });

    // Delete from database
    await prisma.file.deleteMany({
      where: {
        id: { in: allFileIds },
        uploadedById: session.user.id,
      },
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
      const s3FolderPath =
        s3.listOfUsersSentFiles(session.user.id) + `/${folderId}`;
      await deleteFolderFromS3(s3FolderPath);
    } catch (s3Error) {
      console.error("Error deleting folder from S3:", s3Error);
      // Don't fail the request if S3 deletion fails
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("User folder delete error:", e);
    return error("Internal server error", 500);
  }
}

// POST: Delete a logical folder (path-based) and its descendants - LEGACY SUPPORT
// Body: { parentPath: string, folderName: string }
export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);
    const body = await request.json();
    const { parentPath, folderName } = body as {
      parentPath?: string;
      folderName?: string;
    };

    if (!folderName) return error("Missing fields", 400);
    if (folderName.includes("/")) {
      return error("Invalid folder name", 400);
    }

    const full = parentPath ? `${parentPath}/${folderName}` : folderName;

    // Get all files in this folder before deleting from DB
    const filesToDelete = await prisma.file.findMany({
      where: {
        uploadedById: session.user.id,
        folderName: { startsWith: full },
      },
      select: { path: true, folderName: true, name: true },
    });

    await prisma.$transaction(async (tx: any) => {
      await tx.file.deleteMany({
        where: {
          uploadedById: session.user.id,
          folderName: { startsWith: full },
        },
      });
      // delete a potential folder record itself
      await tx.file.deleteMany({
        where: {
          uploadedById: session.user.id,
          type: "folder",
          name: folderName,
          folderName: parentPath || "",
        },
      });
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
      const s3FolderPath =
        s3.listOfUsersSentFiles(session.user.id) + (full ? `/${full}` : "");
      await deleteFolderFromS3(s3FolderPath);
    } catch (s3Error) {
      console.error("Error deleting folder from S3:", s3Error);
      // Don't fail the request if S3 deletion fails
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("User folder delete error:", e);
    return error("Internal server error", 500);
  }
}
