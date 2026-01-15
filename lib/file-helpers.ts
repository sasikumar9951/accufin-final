import prisma from "@/lib/prisma";
import { s3 } from "@/lib/s3";

type FileSelectMinimal = {
  id: string;
  path: string | null;
  parentFolderId: string | null;
};

export async function isDescendantFolder(
  parentId: string,
  checkId: string,
  whereExtra: Record<string, any>
): Promise<boolean> {
  if (parentId === checkId) return true;

  const children = await prisma.file.findMany({
    where: { parentFolderId: parentId, type: "folder", ...whereExtra },
    select: { id: true },
  });

  for (const child of children) {
    if (await isDescendantFolder(child.id, checkId, whereExtra)) {
      return true;
    }
  }
  return false;
}

export async function getDescendantFiles(
  folderId: string,
  whereExtra: Record<string, any>
): Promise<FileSelectMinimal[]> {
  const children = await prisma.file.findMany({
    where: { parentFolderId: folderId, ...whereExtra },
    select: { id: true, path: true, parentFolderId: true, type: true },
  });

  const allFiles: FileSelectMinimal[] = [];
  for (const child of children) {
    if ((child as any).type === "folder") {
      const descendants = await getDescendantFiles(child.id, whereExtra);
      allFiles.push(...descendants);
    } else {
      allFiles.push({
        id: child.id,
        path: child.path,
        parentFolderId: child.parentFolderId,
      });
    }
  }
  return allFiles;
}

export function generateUserMovePath(
  originalPath: string,
  newFolderId: string | null,
  userId: string
): string {
  if (!originalPath) return "";
  const filename = originalPath.split("/").at(-1) ?? "";
  return s3.getUserSendingFilePath(userId, filename, newFolderId || undefined);
}

export function generateAdminMovePath(
  originalPath: string,
  newFolderId: string | null,
  userId: string,
  isPrivate: boolean,
  adminId: string
): string {
  if (!originalPath) return "";
  const filename = originalPath.split("/").at(-1) ?? "";
  return isPrivate
    ? s3.getAdminPrivateUploadPath(adminId, userId, filename, newFolderId || undefined)
    : s3.getUserReceivedFilePath(userId, filename, newFolderId || undefined);
}

export function withFlag(where: Record<string, any>, flagKey: string, flagValue: boolean) {
  return { ...where, [flagKey]: flagValue };
}


