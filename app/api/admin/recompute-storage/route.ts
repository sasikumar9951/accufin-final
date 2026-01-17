import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendStorageThresholdEmail } from "@/lib/email";

function parseSizeToKB(size: string | null | undefined): number {
  if (!size) return 0;
  const trimmed = size.trim();
  // Expected formats: "123", "123 B", "123.4 KB", "1.2 MB", "0.5 GB"
  // Default to KB when unit missing but value looks numeric
  const sizeRegex = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i;
  const match = sizeRegex.exec(trimmed);
  if (!match) return 0;
  const value = Number.parseFloat(match[1]);
  const unit = (match[2] || "KB").toUpperCase();
  switch (unit) {
    case "B":
      return value / 1024;
    case "KB":
      return value;
    case "MB":
      return value * 1024;
    case "GB":
      return value * 1024 * 1024;
    default:
      return 0;
  }
}

// Convert KB to human readable format
function formatStorageSize(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb} KB`;
}

// Create admin notifications for storage threshold
async function createAdminNotifications(
  title: string,
  message: string,
): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a: any) => ({
        title,
        message,
        userId: a.id,
      })),
    });
  }
}

// Create user notification for storage threshold
async function createUserNotification(
  userId: string,
  title: string,
  message: string,
): Promise<void> {
  await prisma.notification.create({
    data: {
      title,
      message,
      userId,
    },
  });
}

// Handle storage threshold notifications and emails
async function handleStorageThresholds(
  userId: string,
  roundedKB: number,
  user: {
    maxStorageLimit: number | null;
    email: string | null;
    name: string | null;
  },
): Promise<{ triggered90: boolean; triggered100: boolean }> {
  let triggered90 = false;
  let triggered100 = false;

  if (!user.maxStorageLimit || user.maxStorageLimit <= 0) {
    return { triggered90, triggered100 };
  }

  const percent = (roundedKB / user.maxStorageLimit) * 100;
  triggered90 = percent >= 90 && percent < 100;
  triggered100 = percent >= 100;

  if (triggered90 || triggered100) {
    const notifyTitle = triggered100 ? "Storage Full" : "High Storage Usage";
    const usedReadable = formatStorageSize(roundedKB);
    const limitReadable = formatStorageSize(user.maxStorageLimit);
    const displayPercent = Math.min(100, Math.round(percent));

    // Admin notification
    const adminMessage = `User ${user.name || "User"} is at ${displayPercent}% storage (${usedReadable} of ${limitReadable}).`;
    await createAdminNotifications(notifyTitle, adminMessage);

    // User notification
    const userMessage = triggered100
      ? `You've reached your storage limit (${usedReadable} of ${limitReadable}). New uploads may fail until you free space or upgrade.`
      : `You're at 90% of your storage limit (${usedReadable} of ${limitReadable}). Consider freeing space or upgrading.`;
    await createUserNotification(userId, notifyTitle, userMessage);

    // Email notification
    if (user.email) {
      await sendStorageThresholdEmail({
        userEmail: user.email,
        userName: user.name || undefined,
        percent: triggered100 ? 100 : 90,
        usedKB: roundedKB,
        limitKB: user.maxStorageLimit,
      });
    }
  }

  return { triggered90, triggered100 };
}

async function recomputeUserStorageUsed(userId: string): Promise<{
  userId: string;
  totalKB: number;
  fileCount: number;
  triggered90: boolean;
  triggered100: boolean;
  breakdown: any;
}> {
  console.log(`Recomputing storage for user: ${userId}`);

  const userFiles = await prisma.file.findMany({
    where: {
      OR: [
        // Case 1: Files uploaded by this user (user -> admin
        {
          uploadedById: userId,
          type: { not: "folder" },
        },
        // Case 2: Files received by this user (admin -> user, private files, response files)
        {
          receivedById: userId,
          type: { not: "folder" },
        },
      ],
    },
    select: {
      id: true,
      size: true,
      isArchived: true,
      isAdminOnlyPrivateFile: true,
      uploadedById: true,
      receivedById: true,
      name: true,
    },
  });

  // Remove duplicates (in case a file has both uploadedById and receivedById as the same user)
  const uniqueFiles = userFiles.filter(
    (file: any, index: any, self: any) =>
      index === self.findIndex((f: any) => f.id === file.id),
  );

  console.log(`Found ${uniqueFiles.length} unique files for user ${userId}`);

  // Calculate storage breakdown by different categories
  const userUploadedFiles = uniqueFiles.filter(
    (f: any) => f.uploadedById === userId,
  );
  const userReceivedFiles = uniqueFiles.filter(
    (f: any) => f.receivedById === userId && f.uploadedById !== userId,
  );
  const privateFiles = uniqueFiles.filter((f: any) => f.isAdminOnlyPrivateFile);
  const responseFiles = uniqueFiles.filter(
    (f: any) => !f.isAdminOnlyPrivateFile,
  );
  const archivedFiles = uniqueFiles.filter((f: any) => f.isArchived);
  const unarchivedFiles = uniqueFiles.filter((f: any) => !f.isArchived);

  console.log(`- User uploaded: ${userUploadedFiles.length}`);
  console.log(`- User received: ${userReceivedFiles.length}`);
  console.log(`- Private files: ${privateFiles.length}`);
  console.log(`- Response files: ${responseFiles.length}`);
  console.log(
    `- Archived: ${archivedFiles.length}, Unarchived: ${unarchivedFiles.length}`,
  );

  // Calculate storage breakdown
  const breakdown = {
    userUploaded: {
      count: userUploadedFiles.length,
      storageKB: userUploadedFiles.reduce(
        (sum: any, f: any) => sum + parseSizeToKB(f.size),
        0,
      ),
    },
    userReceived: {
      count: userReceivedFiles.length,
      storageKB: userReceivedFiles.reduce(
        (sum: any, f: any) => sum + parseSizeToKB(f.size),
        0,
      ),
    },
    byArchiveStatus: {
      archived: archivedFiles.length,
      unarchived: unarchivedFiles.length,
    },
    byPrivacy: {
      private: privateFiles.length,
      public: responseFiles.length,
    },
  };

  const totalKB = uniqueFiles.reduce(
    (sum: any, f: any) => sum + parseSizeToKB(f.size),
    0,
  );
  const roundedKB = Math.max(0, Math.round(totalKB));

  console.log(`Total storage for user ${userId}: ${roundedKB} KB`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { maxStorageLimit: true, email: true, name: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { storageUsed: roundedKB },
  });

  // Handle storage thresholds if user exists
  const thresholds = user
    ? await handleStorageThresholds(userId, roundedKB, user)
    : { triggered90: false, triggered100: false };

  return {
    userId,
    totalKB: roundedKB,
    fileCount: uniqueFiles.length,
    triggered90: thresholds.triggered90,
    triggered100: thresholds.triggered100,
    breakdown,
  };
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId) {
      // Recompute for a single user
      console.log(`Recomputing storage for single user: ${userId}`);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const result = await recomputeUserStorageUsed(userId);
      return NextResponse.json({
        ok: true,
        message: `Storage recomputed for user ${user.email}`,
        updated: [result],
      });
    }

    // Recompute for all users
    console.log("Starting storage recomputation for all users...");
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, isAdmin: true },
    });

    console.log(`Found ${users.length} users to process`);

    const results: Array<{
      userId: string;
      totalKB: number;
      fileCount: number;
      breakdown: any;
    }> = [];
    let processedCount = 0;

    for (const user of users) {
      try {
        console.log(
          `Processing user ${processedCount + 1}/${users.length}: ${user.email}`,
        );
        const result = await recomputeUserStorageUsed(user.id);
        results.push(result);
        processedCount++;

        // Log progress every 10 users
        if (processedCount % 10 === 0) {
          console.log(`Processed ${processedCount}/${users.length} users`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        results.push({
          userId: user.id,
          totalKB: 0,
          fileCount: 0,
          breakdown: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }

    const totalStorage = results.reduce(
      (sum: any, r: any) => sum + r.totalKB,
      0,
    );
    const totalFiles = results.reduce(
      (sum: any, r: any) => sum + r.fileCount,
      0,
    );

    console.log(
      `Storage recomputation completed. Total: ${totalFiles} files, ${totalStorage} KB`,
    );

    return NextResponse.json({
      ok: true,
      message: `Storage recomputed for ${processedCount} users`,
      summary: {
        totalUsers: users.length,
        processedUsers: processedCount,
        totalFiles: totalFiles,
        totalStorageKB: totalStorage,
        timestamp: new Date().toISOString(),
      },
      updated: results,
    });
  } catch (error) {
    console.error("recompute-storage error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow GET for convenience (curl)
  return POST(request);
}

// curl -X GET "http://localhost:3000/api/admin/recompute-storage" \
//   -H "x-admin-secret: admin"
