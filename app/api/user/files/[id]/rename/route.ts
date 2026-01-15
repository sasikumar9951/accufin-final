import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { newName } = body as { newName?: string };

    if (!newName || newName.trim() === "" || newName.includes("/")) {
      return NextResponse.json(
        { error: "Invalid name" },
        { status: 400 }
      );
    }

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (file.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If this is a folder pseudo-entry, update its name and cascade folderName for descendants
    if (file.type === "folder") {
      const oldFolderPath = file.folderName ? `${file.folderName}/${file.name}` : file.name ?? "";
      const parentFolder = file.folderName ?? "";
      const newFolderPath = parentFolder ? `${parentFolder}/${newName}` : newName;

      const updatedFolder = await prisma.$transaction(async (tx) => {
        const updated = await tx.file.update({
          where: { id },
          data: { name: newName },
        });

        // Update descendants' folderName: replace prefix oldFolderPath with newFolderPath
        const descendants = await tx.file.findMany({
          where: {
            folderName: {
              startsWith: oldFolderPath,
            },
          },
          select: { id: true, folderName: true },
        });

        for (const d of descendants) {
          const suffix = d.folderName!.slice(oldFolderPath.length);
          await tx.file.update({
            where: { id: d.id },
            data: { folderName: `${newFolderPath}${suffix}` },
          });
        }

        // Notify admins about folder rename
        const admins = await tx.user.findMany({ where: { isAdmin: true }, select: { id: true } });
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map((a) => ({
              title: `Folder renamed by ${session.user.name || "User"}`,
              message: `"${oldFolderPath}" renamed to "${newFolderPath}"`,
              userId: a.id,
            })),
          });
        }

        return updated;
      });

      return NextResponse.json(updatedFolder, { status: 200 });
    }

    // Regular file: update the display name only
    const updatedFile = await prisma.file.update({
      where: { id },
      data: { name: newName },
    });
    // Notify admins about file rename
    const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          title: `File renamed by ${session.user.name || "User"}`,
          message: `"${file.name || "(unnamed)"}" renamed to "${newName}"`,
          userId: a.id,
        })),
      });
    }
    return NextResponse.json(updatedFile, { status: 200 });
  } catch (e) {
    console.error("Error renaming file/folder:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


