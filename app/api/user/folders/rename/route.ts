import { NextRequest, NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

// PATCH: Rename a folder by ID
// Body: { folderId: string, newName: string }
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);
    const body = await request.json();
    const { folderId, newName } = body as {
      folderId?: string;
      newName?: string;
    };

    if (!folderId || !newName) return error("Missing fields", 400);
    if (newName.includes("/")) {
      return error("Invalid folder name", 400);
    }

    // Verify the folder belongs to the user
    const folder = await prisma.file.findFirst({
      where: {
        id: folderId,
        type: "folder",
        uploadedById: session.user.id,
      },
    });

    if (!folder) return error("Folder not found", 404);

    // Update the folder name
    const updated = await prisma.file.update({
      where: { id: folderId },
      data: { name: newName },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error("User folder rename error:", e);
    return error("Internal server error", 500);
  }
}

// POST: Rename a logical folder (path-based), even if no explicit folder record exists - LEGACY SUPPORT
// Body: { parentPath: string, folderName: string, newName: string }
export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);
    const body = await request.json();
    const { parentPath, folderName, newName } = body as {
      parentPath?: string;
      folderName?: string;
      newName?: string;
    };

    if (!folderName || !newName) return error("Missing fields", 400);
    if (newName.includes("/") || folderName.includes("/")) {
      return error("Invalid folder names", 400);
    }

    const oldFull = parentPath ? `${parentPath}/${folderName}` : folderName;
    const newFull = parentPath ? `${parentPath}/${newName}` : newName;

    const updated = await prisma.$transaction(async (tx: any) => {
      // Update descendants whose folderName starts with oldFull
      const descendants = await tx.file.findMany({
        where: {
          uploadedById: session.user.id,
          folderName: { startsWith: oldFull },
        },
        select: { id: true, folderName: true },
      });
      for (const d of descendants) {
        const suffix = d.folderName!.slice(oldFull.length);
        await tx.file.update({
          where: { id: d.id },
          data: { folderName: `${newFull}${suffix}` },
        });
      }

      // If a folder record exists at old path, rename its name
      const folderRecord = await tx.file.findFirst({
        where: {
          uploadedById: session.user.id,
          type: "folder",
          name: folderName,
          folderName: parentPath || "",
        },
      });
      if (folderRecord) {
        await tx.file.update({
          where: { id: folderRecord.id },
          data: { name: newName },
        });
      }

      return {
        count: descendants.length,
        folderRecordUpdated: Boolean(folderRecord),
      };
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error("User folder rename error:", e);
    return error("Internal server error", 500);
  }
}
