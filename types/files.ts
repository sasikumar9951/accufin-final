export type ManagedFile = {
  id: string;
  name: string;
  url: string;
  size?: string | null;
  createdAt?: string;
  folderName?: string | null;
  parentFolderId?: string | null;
};
