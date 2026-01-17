import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

// PATCH: Rename a folder by ID
// Body: { folderId: string, newName: string, selectedUserId: string, isPrivate?: boolean }
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const body = await request.json();
    const { folderId, newName, selectedUserId, isPrivate } = body as {
      folderId?: string;
      newName?: string;
      selectedUserId?: string;
      isPrivate?: boolean;
    };

    if (!folderId || !newName || !selectedUserId) return error("Missing fields", 400);
    if (newName.includes("/")) {
      return error("Invalid folder name", 400);
    }

    const scopeFilter: any = {
      receivedById: selectedUserId,
    };
    if (typeof isPrivate === "boolean") {
      scopeFilter.isAdminOnlyPrivateFile = isPrivate;
    }

    // Verify the folder exists and belongs to the user
    const folder = await prisma.file.findFirst({
      where: {
        id: folderId,
        type: "folder",
        ...scopeFilter,
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
    console.error("Admin folder rename error:", e);
    return error("Internal server error", 500);
  }
}

// POST: Rename a logical folder (path-based), even if no explicit folder record exists - LEGACY SUPPORT
// Body: { selectedUserId: string, parentPath: string, folderName: string, newName: string, isPrivate?: boolean }
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const body = await request.json();
    const { selectedUserId, parentPath, folderName, newName, isPrivate } =
      body as {
        selectedUserId?: string;
        parentPath?: string;
        folderName?: string;
        newName?: string;
        isPrivate?: boolean;
      };

    if (!selectedUserId || !folderName || !newName) return error("Missing fields", 400);
    if (newName.includes("/") || folderName.includes("/")) {
      return error("Invalid folder names", 400);
    }

    const oldFull = parentPath ? `${parentPath}/${folderName}` : folderName;
    const newFull = parentPath ? `${parentPath}/${newName}` : newName;

    const scopeFilter: any = {
      receivedById: selectedUserId,
    };
    if (typeof isPrivate === "boolean") {
      scopeFilter.isAdminOnlyPrivateFile = isPrivate;
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      // Update descendants whose folderName starts with oldFull
      const descendants = await tx.file.findMany({
        where: {
          ...scopeFilter,
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
          ...scopeFilter,
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
    console.error("Admin folder rename error:", e);
    return error("Internal server error", 500);
  }
}
