import { s3 } from "@/lib/s3";

export const generateUserCopyPath = (
  originalPath: string,
  newFolderId: string | null,
  userId: string,
  newFileId: string
): string => {
  if (!originalPath) return "";
  const parts = originalPath.split("/");
  const filename = parts.at(-1) ?? "";
  const dotIndex = filename.lastIndexOf(".");
  const suffix = `_copy_${newFileId.substring(0, 8)}`;
  const newFilename = dotIndex > 0
    ? `${filename.substring(0, dotIndex)}${suffix}${filename.substring(dotIndex)}`
    : `${filename}${suffix}`;
  return s3.getUserSendingFilePath(userId, newFilename, newFolderId || undefined);
};

export const generateAdminCopyPath = (
  originalPath: string,
  newFolderId: string | null,
  userId: string,
  isPrivate: boolean,
  adminId: string,
  newFileId: string
): string => {
  if (!originalPath) return "";
  const parts = originalPath.split("/");
  const filename = parts.at(-1) ?? "";
  const dotIndex = filename.lastIndexOf(".");
  const suffix = `_copy_${newFileId.substring(0, 8)}`;
  const newFilename = dotIndex > 0
    ? `${filename.substring(0, dotIndex)}${suffix}${filename.substring(dotIndex)}`
    : `${filename}${suffix}`;
  return isPrivate
    ? s3.getAdminPrivateUploadPath(adminId, userId, newFilename, newFolderId || undefined)
    : s3.getUserReceivedFilePath(userId, newFilename, newFolderId || undefined);
};


