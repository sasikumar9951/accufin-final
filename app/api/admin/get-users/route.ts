import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import { getSignedUrlFromPath } from "@/lib/s3";

type FileCountData = {
  uploadedById: string | null;
  receivedById: string | null;
  type: string | null;
  _count: { id: number };
};

type FileCounts = {
  filesReceivedFromAdmin: number;
  filesUploadedToAdmin: number;
  foldersUploadedToAdmin: number;
};

function initializeFileCounts(): FileCounts {
  return {
    filesReceivedFromAdmin: 0,
    filesUploadedToAdmin: 0,
    foldersUploadedToAdmin: 0,
  };
}

function updateUploadedCounts(
  counts: FileCounts,
  type: string | null,
  countValue: number
): void {
  if (type === "folder") {
    counts.foldersUploadedToAdmin += countValue;
  } else {
    counts.filesUploadedToAdmin += countValue;
  }
}

function buildFileCountMap(fileCounts: FileCountData[]): Map<string, FileCounts> {
  const fileCountMap = new Map<string, FileCounts>();

  for (const { uploadedById, receivedById, type, _count } of fileCounts) {
    // Handle files uploaded by user to admin
    if (uploadedById && receivedById) {
      if (!fileCountMap.has(uploadedById)) {
        fileCountMap.set(uploadedById, initializeFileCounts());
      }

      const counts = fileCountMap.get(uploadedById)!;
      updateUploadedCounts(counts, type, _count.id);
    }

    // Handle files received by user from admin
    if (receivedById && uploadedById) {
      if (!fileCountMap.has(receivedById)) {
        fileCountMap.set(receivedById, initializeFileCounts());
      }

      const counts = fileCountMap.get(receivedById)!;
      counts.filesReceivedFromAdmin += _count.id;
    }
  }

  return fileCountMap;
}

async function addSignedUrlsToUsers(users: any[]): Promise<any[]> {
  return Promise.all(
    users.map(async (user: any) => {
      if (user.profileUrl) {
        try {
          // Check if it's a Google profile image URL
          if (user.profileUrl.includes('googleusercontent.com') || user.profileUrl.startsWith('https://lh3.googleusercontent.com')) {
            // For Google profile images, use the URL directly but ensure it's properly formatted
            let googleUrl = user.profileUrl;
            // If the URL doesn't have size parameters, add a reasonable default
            if (!googleUrl.includes('=s') && !googleUrl.includes('=w')) {
              googleUrl = googleUrl + '=s200';
            }
            // If it has =s96-c, it might be better to change to a simpler format for better compatibility
            if (googleUrl.includes('=s96-c')) {
              googleUrl = googleUrl.replace('=s96-c', '=s200');
            }
            return { ...user, profileImageUrl: googleUrl };
          } else if (user.profileUrl.startsWith('https://')) {
            // For other HTTPS URLs, use directly (could be other OAuth providers)
            return { ...user, profileImageUrl: user.profileUrl };
          } else {
            // For S3 paths, generate signed URL
            const signedUrl = await getSignedUrlFromPath(user.profileUrl);
            return { ...user, profileUrl: signedUrl, profileImageUrl: signedUrl };
          }
        } catch (error) {
          console.error('Error processing profile URL for user', user.id, ':', error);
          // Return user without profile image if there's an error
          return { ...user, profileImageUrl: null };
        }
      }
      return user;
    })
  );
}

function transformUserData(users: any[], fileCountMap: Map<string, FileCounts>): any[] {
  return users.map((user: any) => {
    const fileCounts = fileCountMap.get(user.id) || initializeFileCounts();

    return {
      ...user,
      uploadedFiles: fileCounts.filesUploadedToAdmin,
      uploadedFolders: fileCounts.foldersUploadedToAdmin,
      formResponses: user._count.formResponses,
      filesReceivedFromAdmin: fileCounts.filesReceivedFromAdmin,
    };
  });
}

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    // Get users and file counts in parallel for better performance
    const [users, fileCounts] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          sinNumber: true,
          businessNumber: true,
          dateOfBirth: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          occupation: true,
          contactNumber: true,
          profileUrl: true,
          isAdmin: true,
          isActive: true,
          storageUsed: true,
          maxStorageLimit: true,
          sendBirthdayEmail: true,
          _count: {
            select: {
              formResponses: true,
            },
          },
        },
      }),
      // Optimized batch query to get all file counts at once
      prisma.file.groupBy({
        by: ["uploadedById", "receivedById", "type"],
        _count: {
          id: true,
        },
        where: {
          OR: [
            { uploadedBy: { isAdmin: true } },
            { receivedBy: { isAdmin: true } },
          ],
        },
      }),
    ]);

    const fileCountMap = buildFileCountMap(fileCounts);
    const usersWithSignedUrls = await addSignedUrlsToUsers(users);
    const transformedUsers = transformUserData(usersWithSignedUrls, fileCountMap);

    return NextResponse.json(transformedUsers);
  } catch (e) {
    console.error("Error getting users:", e);
    return error("Internal server error", 500);
  }
}
