import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteFileFromS3, deleteFolderFromS3, s3 } from "@/lib/s3";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check authorization: users can only delete their own files, admins can delete any file
    if (!session.user.isAdmin && file.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    if (file.type === "folder") {
      // Get all descendants recursively using parentFolderId
      const getAllDescendants = async (parentId: string): Promise<string[]> => {
        const children = await prisma.file.findMany({
          where: { parentFolderId: parentId, uploadedById: session.user.id },
          select: { id: true, type: true },
        });

        let allIds: string[] = [parentId];
        for (const child of children) {
          if (child.type === "folder") {
            const subIds = await getAllDescendants(child.id);
            allIds = allIds.concat(subIds);
          } else {
            allIds.push(child.id);
          }
        }
        return allIds;
      };

      const allFileIds = await getAllDescendants(id);

      // Get all files to delete from S3 and calculate storage to free
      const filesToDelete = await prisma.file.findMany({
        where: {
          id: { in: allFileIds },
          uploadedById: session.user.id,
        },
        select: { path: true, name: true, size: true, type: true },
      });

      // Calculate total storage to decrement (only for actual files, not folders)
      const totalStorageKB = filesToDelete.reduce((sum: any, f: any) => {
        if (f.type !== "folder") {
          return sum + parseFileSizeToKB(f.size);
        }
        return sum;
      }, 0);

      await prisma.$transaction(async (tx) => {
        // Delete all descendants and the folder itself
        await tx.file.deleteMany({
          where: {
            id: { in: allFileIds },
            uploadedById: session.user.id,
          },
        });

        // Decrement storage for the file owner (not the admin deleting it)
        if (totalStorageKB > 0 && file.uploadedById) {
          await tx.user.update({
            where: { id: file.uploadedById },
            data: { storageUsed: { decrement: totalStorageKB } },
          });
        }

        // Notify admins about folder delete
        const admins = await tx.user.findMany({
          where: { isAdmin: true },
          select: { id: true },
        });
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map((a) => ({
              title: `Folder deleted by ${session.user.name || "User"}`,
              message: `Deleted folder "${file.name || "Unnamed Folder"}" and its contents`,
              userId: a.id,
            })),
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

        // Also try to delete the folder path from S3 using folder ID
        const s3FolderPath = s3.getUserSendingFilePath(session.user.id, "", id);
        await deleteFolderFromS3(s3FolderPath);
      } catch (s3Error) {
        console.error("Error deleting folder from S3:", s3Error);
        // Don't fail the request if S3 deletion fails
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Calculate storage to decrement for single file
    const fileSizeKB = parseFileSizeToKB(file.size);

    await prisma.$transaction(async (tx) => {
      // Delete the file
      await tx.file.delete({ where: { id } });

      // Decrement storage for the file owner (not the admin deleting it)
      if (fileSizeKB > 0 && file.uploadedById) {
        await tx.user.update({
          where: { id: file.uploadedById },
          data: { storageUsed: { decrement: fileSizeKB } },
        });
      }
      console.log("fileSizeKB in user/files/[id]/route.ts file :", fileSizeKB);

      // Notify admins about file delete
      const admins = await tx.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
      });
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((a) => ({
            title: `File deleted by ${session.user.name || "User"}`,
            message: `Deleted file "${file.name || "(unnamed)"}"`,
            userId: a.id,
          })),
        });
      }
    });

    // Delete from S3 after successful DB deletion
    try {
      if (file.path) {
        await deleteFileFromS3(file.path);
      }
    } catch (s3Error) {
      console.error("Error deleting file from S3:", s3Error);
      // Don't fail the request if S3 deletion fails
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("Error deleting file/folder:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
