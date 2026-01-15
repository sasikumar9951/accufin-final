export type FileItem = {
  id: string;
  name: string;
  fullPath: string;
  relativePath: string;
  size: number;
  type: string;
  file: File;
  parentPath?: string;
};

export type FolderNode = {
  name: string;
  path: string;
  files: FileItem[];
  subfolders: { [key: string]: FolderNode };
  isExpanded: boolean;
  depth: number;
  parentPath?: string;
};

export type FolderUploadPlan = {
  foldersToCreate: Array<{
    name: string;
    path: string;
    parentPath?: string;
  }>;
  filesToUpload: FileItem[];
  totalFiles: number;
  totalSize: number;
};

/**
 * Build a hierarchical folder structure from FileList
 */
export function buildFolderStructure(files: FileList): FolderNode {
  const root: FolderNode = {
    name: "Root",
    path: "",
    files: [],
    subfolders: {},
    isExpanded: true,
    depth: 0,
  };

  const filesArray = Array.from(files);
  for (let index = 0; index < filesArray.length; index++) {
    const file = filesArray[index];
    const relativePath = file.webkitRelativePath || file.name;
    const pathParts = relativePath.split("/");
    const fileName = pathParts.at(-1) ?? "";
    const folderPath = pathParts.slice(0, -1);

    const fileItem: FileItem = {
      id: `file-${index}-${Date.now()}`,
      name: fileName,
      fullPath: relativePath,
      relativePath,
      size: file.size,
      type: file.type || "application/octet-stream",
      file,
      parentPath: folderPath.join("/"),
    };

    // Navigate to the correct folder and create folders as needed
    let currentNode = root;
    let currentPath = "";

    for (let idx = 0; idx < folderPath.length; idx++) {
      const folderName = folderPath[idx];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      if (!currentNode.subfolders[folderName]) {
        currentNode.subfolders[folderName] = {
          name: folderName,
          path: currentPath,
          files: [],
          subfolders: {},
          isExpanded: false,
          depth: idx + 1,
          parentPath: parentPath || undefined,
        };
      }
      currentNode = currentNode.subfolders[folderName];
    }

    // Add file to the final folder
    currentNode.files.push(fileItem);
  }

  return root;
}

/**
 * Extract all files from a folder structure
 */
export function extractAllFiles(node: FolderNode): FileItem[] {
  const allFiles: FileItem[] = [];

  const extractFiles = (currentNode: FolderNode) => {
    allFiles.push(...currentNode.files);
    for (const subfolder of Object.values(currentNode.subfolders)) {
      extractFiles(subfolder);
    }
  };

  extractFiles(node);
  return allFiles;
}

/**
 * Extract all folders that need to be created, in the correct order
 */
export function extractFoldersToCreate(node: FolderNode): Array<{
  name: string;
  path: string;
  parentPath?: string;
  depth: number;
}> {
  const folders: Array<{
    name: string;
    path: string;
    parentPath?: string;
    depth: number;
  }> = [];

  const extractFolders = (currentNode: FolderNode) => {
    // Skip root node
    if (currentNode.name !== "Root") {
      folders.push({
        name: currentNode.name,
        path: currentNode.path,
        parentPath: currentNode.parentPath,
        depth: currentNode.depth,
      });
    }

    for (const subfolder of Object.values(currentNode.subfolders)) {
      extractFolders(subfolder);
    }
  };

  extractFolders(node);

  // Sort by depth to ensure parent folders are created before children
  return folders.sort((a, b) => a.depth - b.depth);
}

/**
 * Create an upload plan from a folder structure
 */
export function createUploadPlan(
  folderStructure: FolderNode
): FolderUploadPlan {
  const foldersToCreate = extractFoldersToCreate(folderStructure);
  const filesToUpload = extractAllFiles(folderStructure);
  const totalSize = filesToUpload.reduce((sum, file) => sum + file.size, 0);

  return {
    foldersToCreate: foldersToCreate.map((folder) => ({
      name: folder.name,
      path: folder.path,
      parentPath: folder.parentPath,
    })),
    filesToUpload,
    totalFiles: filesToUpload.length,
    totalSize,
  };
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Toggle folder expansion state
 */
export function toggleFolderExpansion(
  node: FolderNode,
  targetPath: string
): FolderNode {
  if (node.path === targetPath) {
    return { ...node, isExpanded: !node.isExpanded };
  }

  const updatedSubfolders = { ...node.subfolders };
  for (const key of Object.keys(updatedSubfolders)) {
    updatedSubfolders[key] = toggleFolderExpansion(
      updatedSubfolders[key],
      targetPath
    );
  }

  return { ...node, subfolders: updatedSubfolders };
}

/**
 * Find a folder node by path
 */
export function findFolderByPath(
  node: FolderNode,
  targetPath: string
): FolderNode | null {
  if (node.path === targetPath) {
    return node;
  }

  for (const subfolder of Object.values(node.subfolders)) {
    const found = findFolderByPath(subfolder, targetPath);
    if (found) return found;
  }

  return null;
}

/**
 * Count total folders in structure
 */
export function countFolders(node: FolderNode): number {
  let count = 0;

  // Don't count root
  if (node.name !== "Root") {
    count = 1;
  }

  for (const subfolder of Object.values(node.subfolders)) {
    count += countFolders(subfolder);
  }

  return count;
}

/**
 * Get folder statistics
 */
export function getFolderStats(node: FolderNode): {
  totalFolders: number;
  totalFiles: number;
  totalSize: number;
  maxDepth: number;
} {
  const allFiles = extractAllFiles(node);
  const totalFolders = countFolders(node);
  const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);

  let maxDepth = 0;
  const findMaxDepth = (currentNode: FolderNode) => {
    maxDepth = Math.max(maxDepth, currentNode.depth);
    for (const subfolder of Object.values(currentNode.subfolders)) {
      findMaxDepth(subfolder);
    }
  };
  findMaxDepth(node);

  return {
    totalFolders,
    totalFiles: allFiles.length,
    totalSize,
    maxDepth,
  };
}
