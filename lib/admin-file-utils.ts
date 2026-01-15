import prisma from "@/lib/prisma";

export type BulkItem = { id: string; type: "file" | "folder" };

// Size helpers
export const parseFileSizeToKB = (sizeString: string): number => {
  const regex = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i;
  const match = regex.exec((sizeString ?? "").toString().trim());
  if (!match) return 0;
  const value = Number.parseFloat(match[1]);
  const unit = (match[2] || "KB").toUpperCase();
  if (unit === "B") return Math.max(0, Math.round(value / 1024));
  if (unit === "KB") return Math.max(0, Math.round(value));
  if (unit === "MB") return Math.max(0, Math.round(value * 1024));
  if (unit === "GB") return Math.max(0, Math.round(value * 1024 * 1024));
  return 0;
};

export const calculateTotalStorageKB = (records: Array<{ type?: string | null; size?: string | null }>): number => {
  return records.reduce((sum, rec) => {
    if (rec.type === "folder") return sum;
    return sum + parseFileSizeToKB(rec.size || "");
  }, 0);
};

// Admin validators (operating on received/private context)
export const validateTargetFolderAdmin = async (
  targetFolderId: string | null,
  userId: string,
  isPrivate: boolean
): Promise<boolean> => {
  if (!targetFolderId) return true;
  const whereClause: any = {
    id: targetFolderId,
    type: "folder",
    receivedById: userId,
    isAdminOnlyPrivateFile: !!isPrivate,
  };
  const targetFolder = await prisma.file.findFirst({ where: whereClause });
  return !!targetFolder;
};

export const validateUserItemsAdmin = async <TSelect extends object>(
  items: BulkItem[],
  userId: string,
  isPrivate: boolean,
  select: TSelect
): Promise<any[]> => {
  const itemIds = items.map((i) => i.id);
  const whereClause: any = {
    id: { in: itemIds },
    receivedById: userId,
    isAdminOnlyPrivateFile: !!isPrivate,
  };
  return prisma.file.findMany({ where: whereClause, select: select as any });
};

// User-uploaded validators (operating on uploadedBy context)
export const validateTargetFolderUserUploaded = async (
  targetFolderId: string | null,
  userId: string
): Promise<boolean> => {
  if (!targetFolderId) return true;
  const targetFolder = await prisma.file.findFirst({
    where: { id: targetFolderId, type: "folder", uploadedById: userId },
  });
  return !!targetFolder;
};

export const validateUserItemsUserUploaded = async <TSelect extends object>(
  items: BulkItem[],
  userId: string,
  select: TSelect
): Promise<any[]> => {
  const itemIds = items.map((i) => i.id);
  return prisma.file.findMany({
    where: { id: { in: itemIds }, uploadedById: userId },
    select: select as any,
  });
};


