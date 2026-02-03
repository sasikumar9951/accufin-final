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
    
    // Also include files received by this user that aren't private (these show in "Uploaded" view too)
    const userReceivedFilesUnarchived = await prisma.file.findMany({
      where: {
        receivedById: id,
        uploadedById: { not: id },  // Don't double-count uploaded files
        isArchived: false,
        isAdminOnlyPrivateFile: false,  // Private files go to Document Management
      },
    });
    
    // Combine uploaded and received files for display in "Uploaded" tab
    const combinedUploadedFiles = [...userUploadedFiles, ...userReceivedFilesUnarchived];
    
    // DIAGNOSTIC: Check if user has any files in the database at all
    const allUserFiles = await prisma.file.findMany({
      where: {
        OR: [
          { uploadedById: id },
          { receivedById: id }
        ]
      },
      select: {
        id: true,
        name: true,
        type: true,
        uploadedById: true,
        receivedById: true,
        isArchived: true,
        isAdminOnlyPrivateFile: true,
        size: true
      }
    });
    
    // Also check for orphaned files that might belong to this user
    const orphanedFiles = await prisma.file.findMany({
      where: {
        AND: [
          {
            OR: [
              { uploadedById: null },
              { receivedById: null }
            ]
          },
          {
            name: {
              // Try to find files by name pattern if user has files with same names
              in: combinedUploadedFiles.map(f => f.name).filter(Boolean)
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        uploadedById: true,
        receivedById: true,
        size: true
      }
    });
    
    const uploadedOnlyCount = userUploadedFiles.length;
    const receivedCount = userReceivedFilesUnarchived.length;
    const combinedCount = combinedUploadedFiles.length;
    const totalCount = allUserFiles.length;
    
    console.log(`Fetching files for user ${id}:`, {
      uploadedOnlyCount,
      receivedCount,
      combinedUploadedCount: combinedCount,
      totalCount,
      uploadedFiles: combinedUploadedFiles.slice(0, 5).map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        parentFolderId: f.parentFolderId,
        path: f.path ? "has-path" : "no-path"
      }))
    });

    // If user has no uploaded files but has total files, they might all be in received/archived categories
    if (combinedCount === 0 && totalCount > 0) {
      console.warn(`⚠️ DATA MISMATCH: User ${id} has ${totalCount} total files but 0 combined files:`, {
        breakdown: allUserFiles.map(f => ({
          name: f.name,
          uploadedById_matches: f.uploadedById === id,
          receivedById_matches: f.receivedById === id,
          isArchived: f.isArchived,
          isPrivate: f.isAdminOnlyPrivateFile,
          type: f.type,
          size: f.size
        }))
      });
    }
    
    // If no files exist but storage is used, alert about orphaned files
    if (totalCount === 0) {
      console.warn(`⚠️ CRITICAL: User ${id} has NO files but storage might be used. Orphaned files found: ${orphanedFiles.length}`, {
        orphanedFiles: orphanedFiles.slice(0, 10)
      });
    }
    
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
        OR: [
          { uploadedById: id },
          { receivedById: id }
        ]
      },
    });
    
    console.log(`Archived files for user ${id}: ${userArchivedFiles.length}`);

    const getSignedUrlForFile = async (file: any) => {
      try {
        if (file.type !== "folder" && file.path) {
          const signedUrl = await getSignedUrlFromPath(file.path);
          return { ...file, url: signedUrl };
        }
        return file;
      } catch (err) {
        console.error(`Error getting signed URL for file ${file.id}:`, err);
        // Return file without URL if signing fails, rather than failing the entire request
        return { ...file, url: undefined };
      }
    };

    const signedUserUploadedFiles = await Promise.allSettled(
      combinedUploadedFiles.map(getSignedUrlForFile)
    ).then(results =>
      results
        .map((result, index) => {
          if (result.status === "fulfilled") return result.value;
          console.error(`Failed to process combined uploaded file at index ${index}:`, result.reason);
          return combinedUploadedFiles[index];
        })
        .filter(file => file !== null && file !== undefined)
    );

    const signedUserReceivedFiles = await Promise.allSettled(
      userReceivedFiles.map(getSignedUrlForFile)
    ).then(results =>
      results
        .map((result, index) => {
          if (result.status === "fulfilled") return result.value;
          console.error(`Failed to process received file at index ${index}:`, result.reason);
          return userReceivedFiles[index];
        })
        .filter(file => file !== null && file !== undefined)
    );

    const signedUserPrivateFiles = await Promise.allSettled(
      userPrivateFiles.map(getSignedUrlForFile)
    ).then(results =>
      results
        .map((result, index) => {
          if (result.status === "fulfilled") return result.value;
          console.error(`Failed to process private file at index ${index}:`, result.reason);
          return userPrivateFiles[index];
        })
        .filter(file => file !== null && file !== undefined)
    );

    const signedUserArchivedFiles = await Promise.allSettled(
      userArchivedFiles.map(getSignedUrlForFile)
    ).then(results =>
      results
        .map((result, index) => {
          if (result.status === "fulfilled") return result.value;
          console.error(`Failed to process archived file at index ${index}:`, result.reason);
          return userArchivedFiles[index];
        })
        .filter(file => file !== null && file !== undefined)
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
