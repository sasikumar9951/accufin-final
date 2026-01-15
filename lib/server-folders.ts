import prisma from "@/lib/prisma";

export async function getAllDescendantIdsIncludingRoot(
  rootFolderId: string,
  userId: string
): Promise<string[]> {
  const collect = async (parentId: string): Promise<string[]> => {
    const children = await prisma.file.findMany({
      where: { parentFolderId: parentId, uploadedById: userId },
      select: { id: true, type: true },
    });

    let ids: string[] = [parentId];
    for (const child of children) {
      if (child.type === "folder") {
        const subIds = await collect(child.id);
        ids = ids.concat(subIds);
      } else {
        ids.push(child.id);
      }
    }
    return ids;
  };

  return collect(rootFolderId);
}

// Generic helpers for collecting descendant ids with optional extra filters
export async function getAllDescendantIds(
  rootFolderId: string,
  extraWhere?: Record<string, unknown>
): Promise<string[]> {
  const collect = async (parentId: string): Promise<string[]> => {
    const children = await prisma.file.findMany({
      where: { parentFolderId: parentId, ...extraWhere },
      select: { id: true, type: true },
    });

    let ids: string[] = [parentId];
    for (const child of children) {
      if (child.type === "folder") {
        const subIds = await collect(child.id);
        ids = ids.concat(subIds);
      } else {
        ids.push(child.id);
      }
    }
    return ids;
  };

  return collect(rootFolderId);
}

export async function getAllArchivedDescendantIds(
  rootFolderId: string,
  extraWhere?: Record<string, unknown>
): Promise<string[]> {
  const whereArchive = { isArchived: true, ...extraWhere } as const;
  return getAllDescendantIds(rootFolderId, whereArchive);
}


