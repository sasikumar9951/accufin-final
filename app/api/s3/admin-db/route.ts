import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSignedUrlFromPath } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    // Handle Folder Creation
    if (body.isFolderCreation) {
      const { folderName, parentFolderId, userId, isAdminOnlyPrivateFile } =
        body;
      const newFolder = await prisma.file.create({
        data: {
          name: folderName,
          type: "folder",
          parentFolderId: parentFolderId || null,
          uploadedById: session.user.id,
          receivedById: userId,
          isAdminOnlyPrivateFile: isAdminOnlyPrivateFile || false,
        },
      });
      // Notify the user only if non-private
      if (!isAdminOnlyPrivateFile) {
        await prisma.notification.create({
          data: {
            title: "New Folder Shared",
            message: `A new folder '${folderName}' has been created for you by ${session.user.name || "Admin"}`,
            userId: userId,
          },
        });
      }
      return NextResponse.json(newFolder, { status: 200 });
    }

    // Handle File Upload
    const {
      filePath,
      // url: putSignedUrl, // ignore any incoming PUT signed URL
      name,
      size,
      type,
      uploadedById,
      isAdminOnlyPrivateFile,
      receivedById,
      parentFolderId,
    } = body;

    // Parse file size to KB for storage tracking
    const parseFileSizeToKB = (sizeStr: string): number => {
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

    const fileSizeKB = parseFileSizeToKB(size || "0 KB");

    const file = await prisma.$transaction(async (tx: any) => {
      // Create the file record
      const createdFile = await tx.file.create({
        data: {
          path: filePath,
          // Do not persist a presigned URL; persist empty or canonical value
          url: "",
          name: name,
          size: size,
          type: type,
          uploadedById: uploadedById,
          receivedById: receivedById,
          isAdminOnlyPrivateFile: isAdminOnlyPrivateFile,
          parentFolderId: parentFolderId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update storage for the user receiving the file (not the admin uploading it)
      if (fileSizeKB > 0 && receivedById) {
        await tx.user.update({
          where: { id: receivedById },
          data: { storageUsed: { increment: fileSizeKB } },
        });
      }

      // Create notification for recipient unless this is an admin-only private file
      if (!isAdminOnlyPrivateFile) {
        await tx.notification.create({
          data: {
            title: "New File Uploaded",
            message: `A new file '${name}' has been uploaded for you by ${session.user.name || "Admin"}`,
            userId: receivedById,
          },
        });
      }

      return createdFile;
    });

    // Immediately return a GET-signed URL so the UI can download without reload
    let responsePayload = file as any;
    if (filePath) {
      try {
        const signedGetUrl = await getSignedUrlFromPath(filePath);
        responsePayload = { ...file, url: signedGetUrl };
      } catch (e) {
        // If signing fails, still return the record; client can refresh later
        console.error("Failed to create GET signed URL for uploaded file", e);
      }
    }
    return NextResponse.json(responsePayload, { status: 200 });
  } catch (e) {
    console.log("error in s3 db", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
