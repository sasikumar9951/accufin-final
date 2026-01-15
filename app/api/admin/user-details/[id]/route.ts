import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { getSignedUrlFromPath } from "@/lib/s3";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const { id } = await params;

    const userUploadedFiles = await prisma.file.findMany({
      where: {
        uploadedById: id,
        isArchived: false,
      },
    });
    const userReceivedFiles = await prisma.file.findMany({
      where: {
        receivedById: id,
        isAdminOnlyPrivateFile: false,
        isArchived: false,
      },
    });
    const userPrivateFiles = await prisma.file.findMany({
      where: {
        receivedById: id,
        isAdminOnlyPrivateFile: true,
        isArchived: false,
      },
    });
    const userArchivedFiles = await prisma.file.findMany({
      where: {
        isArchived: true,
        uploadedById: id,
      },
    });

    const getSignedUrlForFile = async (file: any) => {
      if (file.type !== "folder" && file.path) {
        const signedUrl = await getSignedUrlFromPath(file.path);
        return { ...file, url: signedUrl };
      }
      return file;
    };

    const signedUserUploadedFiles = await Promise.all(
      userUploadedFiles.map(getSignedUrlForFile)
    );
    const signedUserReceivedFiles = await Promise.all(
      userReceivedFiles.map(getSignedUrlForFile)
    );
    const signedUserPrivateFiles = await Promise.all(
      userPrivateFiles.map(getSignedUrlForFile)
    );
    const signedUserArchivedFiles = await Promise.all(
      userArchivedFiles.map(getSignedUrlForFile)
    );

    return NextResponse.json({
      userUploadedFiles: signedUserUploadedFiles,
      userReceivedFiles: signedUserReceivedFiles,
      userPrivateFiles: signedUserPrivateFiles,
      userArchivedFiles: signedUserArchivedFiles,
    });
  } catch (e) {
    console.error("Error getting user details:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
