import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendStorageThresholdEmail } from "@/lib/email";

function parseSizeToKB(size: string | null | undefined): number {
  if (!size) return 0;
  const trimmed = size.trim();
  const regex = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i;
  const match = regex.exec(trimmed);
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

// Convert KB to human-readable format
function formatReadableSize(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb} KB`;
}

// Check if storage limit is exceeded
async function checkStorageLimit(
  uploadedById: string,
  size: string
): Promise<{ exceeded: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: uploadedById },
    select: { storageUsed: true, maxStorageLimit: true },
  });

  if (user?.maxStorageLimit && user.maxStorageLimit > 0) {
    const incomingKB = Math.max(0, Math.round(parseSizeToKB(size)));
    const projected = (user.storageUsed || 0) + incomingKB;
    if (projected >= user.maxStorageLimit) {
      return {
        exceeded: true,
        error: "Storage limit reached. Cannot upload new files.",
      };
    }
  }
  return { exceeded: false };
}

// Handle folder creation
async function handleFolderCreation(
  folderName: string,
  parentFolderId: string | null,
  userId: string,
  adminId: string,
  userName: string | null | undefined,
  adminIds: { id: string }[]
) {
  const newFolder = await prisma.file.create({
    data: {
      name: folderName,
      type: "folder",
      parentFolderId: parentFolderId || null,
      uploadedById: userId,
      receivedById: adminId,
      isAdminOnlyPrivateFile: false,
    },
  });

  await prisma.notification.createMany({
    data: adminIds.map((a) => ({
      title: "New Folder Created",
      message: `New folder '${folderName}' created by ${userName || "User"}`,
      userId: a.id,
    })),
  });

  return newFolder;
}

// Send storage threshold notifications
async function sendStorageNotifications(params: {
  uploadedById: string;
  prevStorageUsed: number;
  incKB: number;
  maxStorageLimit: number;
  userEmail: string | null;
  userName: string | null | undefined;
  sessionUserName: string | null | undefined;
  sessionUserEmail: string | null | undefined;
  adminIds: { id: string }[];
}) {
  const {
    uploadedById,
    prevStorageUsed,
    incKB,
    maxStorageLimit,
    userEmail,
    userName,
    sessionUserName,
    sessionUserEmail,
    adminIds,
  } = params;

  const newPercent = ((prevStorageUsed + incKB) / maxStorageLimit) * 100;
  const is90orMore = newPercent >= 90 && newPercent < 100;
  const is100orMore = newPercent >= 100;

  if (is90orMore || is100orMore) {
    const percentToReport = is100orMore ? Math.floor(newPercent) : 90;
    const notifyTitle = is100orMore ? "Storage Full" : "High Storage Usage";
    const usedReadable = formatReadableSize(prevStorageUsed + incKB);
    const limitReadable = formatReadableSize(maxStorageLimit);

    // Notify admins
    await prisma.notification.createMany({
      data: adminIds.map((a) => ({
        title: notifyTitle,
        message: `User ${sessionUserName || "User"} (${sessionUserEmail || userEmail || ""}) is at ${Math.min(100, Math.round(newPercent))}% storage (${usedReadable} of ${limitReadable}).`,
        userId: a.id,
      })),
    });

    // Notify user
    await prisma.notification.create({
      data: {
        title: notifyTitle,
        message: is100orMore
          ? `You've reached your storage limit (${usedReadable} of ${limitReadable}). New uploads may fail until you free space or upgrade.`
          : `You're at ${percentToReport}% of your storage limit (${usedReadable} of ${limitReadable}). Consider freeing space or upgrading.`,
        userId: uploadedById,
      },
    });

    // Send email
    if (userEmail) {
      await sendStorageThresholdEmail({
        userEmail,
        userName: userName || undefined,
        percent: Math.min(percentToReport, 100),
        usedKB: prevStorageUsed + incKB,
        limitKB: maxStorageLimit,
      });
    }
  }
}

// Update storage usage and send notifications if needed
async function updateStorageUsage(
  uploadedById: string,
  size: string,
  type: string,
  sessionUserName: string | null | undefined,
  sessionUserEmail: string | null | undefined,
  adminIds: { id: string }[]
) {
  if (type === "folder" || !uploadedById) return;

  const incKB = Math.max(0, Math.round(parseSizeToKB(size)));
  if (incKB <= 0) return;

  const prevUser = await prisma.user.findUnique({
    where: { id: uploadedById },
    select: { storageUsed: true, maxStorageLimit: true, email: true, name: true },
  });

  await prisma.user.update({
    where: { id: uploadedById },
    data: { storageUsed: { increment: incKB } },
  });

  if (prevUser?.maxStorageLimit && prevUser.maxStorageLimit > 0) {
    await sendStorageNotifications({
      uploadedById,
      prevStorageUsed: prevUser.storageUsed || 0,
      incKB,
      maxStorageLimit: prevUser.maxStorageLimit,
      userEmail: prevUser.email,
      userName: prevUser.name,
      sessionUserName,
      sessionUserEmail,
      adminIds,
    });
  }
}

// Notify admins about new file upload
async function notifyAdminsAboutUpload(
  isAdminOnlyPrivateFile: boolean,
  fileName: string,
  userName: string | null | undefined,
  adminIds: { id: string }[]
) {
  if (!isAdminOnlyPrivateFile) {
    await prisma.notification.createMany({
      data: adminIds.map((a) => ({
        title: "New File Uploaded",
        message: `A new file '${fileName}' has been uploaded by ${userName || "User"}`,
        userId: a.id,
      })),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    // Fetch all admins for notification fanout
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });
    if (admins.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Handle Folder Creation
    if (body.isFolderCreation) {
      const { folderName, parentFolderId } = body;
      const newFolder = await handleFolderCreation(
        folderName,
        parentFolderId,
        session.user.id,
        admins[0].id,
        session.user.name,
        admins
      );
      return NextResponse.json(newFolder, { status: 200 });
    }

    // Handle File Upload
    const {
      filePath,
      url,
      name,
      size,
      type,
      uploadedById,
      isAdminOnlyPrivateFile,
      parentFolderId,
    } = body;

    console.log("filePath", filePath);
    console.log("url", url);
    console.log("name", name);
    console.log("size", size);
    console.log("type", type);
    console.log("uploadedById", uploadedById);
    console.log("isAdminOnlyPrivateFile", isAdminOnlyPrivateFile);
    console.log("parentFolderId", parentFolderId);

    // Guard: block uploads when user is at or above 100% storage
    if (uploadedById) {
      const limitCheck = await checkStorageLimit(uploadedById, size);
      if (limitCheck.exceeded) {
        return NextResponse.json(
          { error: limitCheck.error },
          { status: 403 }
        );
      }
    }

    const file = await prisma.file.create({
      data: {
        path: filePath,
        url: url,
        name: name,
        size: size,
        type: type,
        uploadedById: uploadedById,
        receivedById: admins[0].id,
        isAdminOnlyPrivateFile: isAdminOnlyPrivateFile,
        parentFolderId: parentFolderId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update storage usage and send notifications if needed
    await updateStorageUsage(
      uploadedById,
      size,
      type,
      session.user.name,
      session.user.email,
      admins
    );

    // Notify admins about new file upload
    await notifyAdminsAboutUpload(
      isAdminOnlyPrivateFile,
      name,
      session.user.name,
      admins
    );

    return NextResponse.json(file, { status: 200 });
  } catch (e) {
    console.log("error in s3 db", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
