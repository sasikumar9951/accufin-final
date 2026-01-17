import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteFolderFromS3, deleteMultipleFilesFromS3, s3 } from "@/lib/s3";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const secret = request.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure user is currently restorable and has a scheduled delete date
    if (!user.isRestorable || !user.deleteUserAt) {
      return NextResponse.json(
        { error: "User is not scheduled for permanent deletion" },
        { status: 400 },
      );
    }

    // Collect S3 paths before DB deletion
    const userFiles = await prisma.file.findMany({
      where: {
        OR: [{ uploadedById: id }, { receivedById: id }],
      },
      select: { path: true },
    });
    const filePaths = userFiles
      .map((f: any) => f.path)
      .filter(Boolean) as string[];

    // Collect form response ids to delete answers first
    const formResponses = await prisma.formResponse.findMany({
      where: { userId: id },
      select: { id: true },
    });
    const formResponseIds = formResponses.map((fr) => fr.id);

    // Perform deletions sequentially to avoid interactive transaction issues in serverless/HMR
    if (formResponseIds.length > 0) {
      await prisma.formAnswer.deleteMany({
        where: { formResponseId: { in: formResponseIds } },
      });
      await prisma.formResponse.deleteMany({
        where: { id: { in: formResponseIds } },
      });
    }

    // Disconnect assigned forms (many-to-many)
    await prisma.user.update({
      where: { id },
      data: { assignedForms: { set: [] } },
    });

    // Delete notifications
    await prisma.notification.deleteMany({ where: { userId: id } });

    // Delete files (uploaded and received)
    await prisma.file.deleteMany({
      where: { OR: [{ uploadedById: id }, { receivedById: id }] },
    });

    // Best-effort cleanup of rate limit rows by email
    if (user.email) {
      await prisma.rateLimit.deleteMany({ where: { identifier: user.email } });
    }

    // Finally delete the user
    await prisma.user.delete({ where: { id } });

    // After DB cleanup, best-effort S3 cleanup
    try {
      if (filePaths.length > 0) {
        await deleteMultipleFilesFromS3(filePaths);
      }
      await deleteFolderFromS3(s3.listOfUsersSentFiles(id));
      await deleteFolderFromS3(s3.listOfUsersReceivedFiles(id));
      await deleteFolderFromS3(s3.getUserProfilePicturePath(id, ""));
    } catch (error_) {
      console.error("Admin user S3 purge error (non-fatal):", error_);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
