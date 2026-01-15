import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  FolderUploadPlan,
  buildFolderStructure,
  createUploadPlan,
} from "@/lib/folder-utils";

type FolderCreationStatus = {
  id: string;
  name: string;
  path: string;
  parentPath?: string;
  status: "pending" | "creating" | "completed" | "error";
  createdId?: string;
  error?: string;
};

type FileUploadStatus = {
  id: string;
  name: string;
  relativePath: string;
  parentPath: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress?: number;
  error?: string;
};

interface UseMultiLevelUploadProps {
  currentFolderId: string | null;
  onFolderCreate: (
    name: string,
    parentId: string | null
  ) => Promise<{ id: string }>;
  onFileUpload: (
    file: File,
    name: string,
    parentId: string
  ) => Promise<boolean>;
  onComplete?: () => void;
}

export function useMultiLevelUpload({
  currentFolderId,
  onFolderCreate,
  onFileUpload,
  onComplete,
}: UseMultiLevelUploadProps) {
  const [uploadPlan, setUploadPlan] = useState<FolderUploadPlan | null>(null);
  const [foldersStatus, setFoldersStatus] = useState<FolderCreationStatus[]>(
    []
  );
  const [filesStatus, setFilesStatus] = useState<FileUploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string>("");
  const [totalFolders, setTotalFolders] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFolders, setCompletedFolders] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);

  // Helpers to reduce duplication when updating item status by id
  const updateById = useCallback(
    <T extends { id: string }>(items: T[], id: string, updater: (item: T) => T): T[] => {
      return items.map((item) => (item.id === id ? updater(item) : item));
    },
    []
  );

  const setFolderStatusById = useCallback(
    (id: string, updater: (f: FolderCreationStatus) => FolderCreationStatus) => {
      setFoldersStatus((prev) => updateById(prev, id, updater));
    },
    [updateById]
  );

  const setFileStatusById = useCallback(
    (id: string, updater: (f: FileUploadStatus) => FileUploadStatus) => {
      setFilesStatus((prev) => updateById(prev, id, updater));
    },
    [updateById]
  );

  const initializeUpload = useCallback((files: FileList) => {
    console.log("Initializing upload with", files.length, "files");

    // Build folder structure
    const structure = buildFolderStructure(files);

    // Create upload plan
    const plan = createUploadPlan(structure);
    setUploadPlan(plan);

    // Initialize status arrays
    const folderStatuses: FolderCreationStatus[] = plan.foldersToCreate.map(
      (folder) => ({
        id: `folder-${folder.path}`,
        name: folder.name,
        path: folder.path,
        parentPath: folder.parentPath,
        status: "pending",
      })
    );

    const fileStatuses: FileUploadStatus[] = plan.filesToUpload.map((file) => ({
      id: file.id,
      name: file.name,
      relativePath: file.relativePath,
      parentPath: file.parentPath || "",
      status: "pending",
    }));

    setFoldersStatus(folderStatuses);
    setFilesStatus(fileStatuses);
    setTotalFolders(plan.foldersToCreate.length);
    setTotalFiles(plan.filesToUpload.length);
    setCompletedFolders(0);
    setCompletedFiles(0);

    return { structure, plan };
  }, []);

  const createFoldersSequentially = useCallback(async () => {
    if (!uploadPlan) return null;

    const folderIdMap = new Map<string, string>();
    // Add current folder to map
    if (currentFolderId) {
      folderIdMap.set("", currentFolderId);
    }

    for (const folder of uploadPlan.foldersToCreate) {
      const statusId = `folder-${folder.path}`;

      try {
        // Update status to creating
        setFolderStatusById(statusId, (f) => ({ ...f, status: "creating" }));
        setCurrentOperation(`Creating folder: ${folder.name}`);

        // Determine parent ID
        const parentId = folder.parentPath
          ? folderIdMap.get(folder.parentPath) || null
          : currentFolderId;

        // Create folder
        const result = await onFolderCreate(folder.name, parentId);

        // Store the created folder ID for child folders
        folderIdMap.set(folder.path, result.id);

        // Update status to completed
        setFolderStatusById(statusId, (f) => ({ ...f, status: "completed", createdId: result.id }));
        setCompletedFolders((prev) => prev + 1);

        console.log(`Created folder: ${folder.name} with ID: ${result.id}`);
      } catch (error) {
        console.error(`Failed to create folder ${folder.name}:`, error);

        // Update status to error
        setFolderStatusById(statusId, (f) => ({
          ...f,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        }));

        toast.error(`Failed to create folder: ${folder.name}`);
        return null;
      }
    }

    return folderIdMap;
  }, [uploadPlan, currentFolderId, onFolderCreate]);

  const uploadFilesSequentially = useCallback(
    async (folderIdMap: Map<string, string>) => {
      if (!uploadPlan) return false;

      for (const file of uploadPlan.filesToUpload) {
        try {
          // Update status to uploading
          setFileStatusById(file.id, (f) => ({ ...f, status: "uploading", progress: 0 }));
          setCurrentOperation(`Uploading file: ${file.name}`);

          // Determine parent folder ID
          const parentId =
            folderIdMap.get(file.parentPath || "") || currentFolderId;
          if (!parentId) {
            throw new Error("Parent folder not found");
          }

          // Simulate upload progress
          for (let progress = 10; progress <= 90; progress += 20) {
            setFileStatusById(file.id, (f) => ({ ...f, progress }));
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Upload file
          const success = await onFileUpload(file.file, file.name, parentId);

          if (!success) {
            throw new Error("Upload failed");
          }

          // Update status to completed
          setFileStatusById(file.id, (f) => ({ ...f, status: "completed", progress: 100 }));
          setCompletedFiles((prev) => prev + 1);

          console.log(`Uploaded file: ${file.name}`);
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error);

          // Update status to error
          setFileStatusById(file.id, (f) => ({
            ...f,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          }));

          toast.error(`Failed to upload file: ${file.name}`);
          // Continue with other files instead of stopping
        }
      }

      return true;
    },
    [uploadPlan, currentFolderId, onFileUpload]
  );

  const startUpload = useCallback(async () => {
    if (!uploadPlan) return false;

    setIsUploading(true);
    setCurrentOperation("Starting upload...");

    try {
      // Step 1: Create all folders sequentially
      console.log("Creating folders...");
      const folderIdMap = await createFoldersSequentially();

      if (!folderIdMap) {
        toast.error("Folder creation failed. Upload cancelled.");
        return false;
      }

      // Step 2: Upload all files sequentially
      console.log("Uploading files...");
      await uploadFilesSequentially(folderIdMap);

      // Complete
      setCurrentOperation("Upload completed!");
      toast.success("Multi-level folder upload completed!");

      // Refresh parent data
      if (onComplete) {
        onComplete();
      }

      return true;
    } catch (error) {
      console.error("Upload process failed:", error);
      toast.error("Upload process failed");
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [
    uploadPlan,
    createFoldersSequentially,
    uploadFilesSequentially,
    onComplete,
  ]);

  const resetUpload = useCallback(() => {
    setUploadPlan(null);
    setFoldersStatus([]);
    setFilesStatus([]);
    setIsUploading(false);
    setCurrentOperation("");
    setTotalFolders(0);
    setTotalFiles(0);
    setCompletedFolders(0);
    setCompletedFiles(0);
  }, []);

  const getOverallProgress = useCallback(() => {
    const totalOperations = totalFolders + totalFiles;
    const completedOperations = completedFolders + completedFiles;
    return totalOperations > 0
      ? (completedOperations / totalOperations) * 100
      : 0;
  }, [totalFolders, totalFiles, completedFolders, completedFiles]);

  return {
    // State
    uploadPlan,
    foldersStatus,
    filesStatus,
    isUploading,
    currentOperation,
    totalFolders,
    totalFiles,
    completedFolders,
    completedFiles,

    // Actions
    initializeUpload,
    startUpload,
    resetUpload,

    // Computed
    getOverallProgress,
  };
}
