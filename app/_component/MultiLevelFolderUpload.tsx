"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Folder,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  FolderUp,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import {
  FolderNode,
  FolderUploadPlan,
  buildFolderStructure,
  createUploadPlan,
  formatFileSize,
} from "@/lib/folder-utils";

// StatusDot component moved outside to prevent unnecessary re-renders
const StatusDot = ({ status }: { status: "pending" | "creating" | "uploading" | "completed" | "error" }) => {
  if (status === "pending") return <Clock className="w-3 h-3 mr-2 text-gray-400" />;
  if (status === "creating" || status === "uploading") {
    return <div className="w-3 h-3 mr-2 border border-blue-500 border-t-transparent rounded-full animate-spin" />;
  }
  if (status === "completed") return <CheckCircle className="w-3 h-3 mr-2 text-green-500" />;
  if (status === "error") return <XCircle className="w-3 h-3 mr-2 text-red-500" />;
  return null;
};

type UploadStep = "select" | "review" | "upload" | "complete";

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

interface MultiLevelFolderUploadProps {
  // Dialog control
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Parent context
  currentFolderId: string | null;

  // Upload functions from parent (different for user/admin)
  onFolderCreate: (
    name: string,
    parentId: string | null
  ) => Promise<{ id: string }>;
  onFileUpload: (
    file: File,
    name: string,
    parentId: string
  ) => Promise<boolean>;

  // UI callbacks
  onComplete: () => void;

  // Context-specific settings
  theme?: "user" | "admin-private" | "admin-response" | "archive";
  title?: string;
}

export default function MultiLevelFolderUpload({
  open,
  onOpenChange,
  currentFolderId,
  onFolderCreate,
  onFileUpload,
  onComplete,
  theme = "user",
  title = "Multi-Level Folder Upload",
}: Readonly<MultiLevelFolderUploadProps>) {
  // Main state
  const [currentStep, setCurrentStep] = useState<UploadStep>("select");
  const [folderStructure, setFolderStructure] = useState<FolderNode | null>(
    null
  );
  const [uploadPlan, setUploadPlan] = useState<FolderUploadPlan | null>(null);

  // Upload progress state
  const [foldersStatus, setFoldersStatus] = useState<FolderCreationStatus[]>(
    []
  );
  const [filesStatus, setFilesStatus] = useState<FileUploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string>("");

  // Statistics
  const [totalFolders, setTotalFolders] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFolders, setCompletedFolders] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);

  // Color theme system
  const colorTheme = {
    user: {
      primary: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-300",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    "admin-private": {
      primary: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-300",
      button: "bg-purple-600 hover:bg-purple-700",
    },
    "admin-response": {
      primary: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-300",
      button: "bg-green-600 hover:bg-green-700",
    },
    archive: {
      primary: "text-gray-600",
      bg: "bg-gray-100",
      border: "border-gray-400",
      button: "bg-gray-600 hover:bg-gray-700",
    },
  } as const;

  const currentTheme = colorTheme[theme];

  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      console.log("Selected files:", files.length);

      // Build folder structure
      const structure = buildFolderStructure(files);
      setFolderStructure(structure);

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

      const fileStatuses: FileUploadStatus[] = plan.filesToUpload.map(
        (file) => ({
          id: file.id,
          name: file.name,
          relativePath: file.relativePath,
          parentPath: file.parentPath || "",
          status: "pending",
        })
      );

      setFoldersStatus(folderStatuses);
      setFilesStatus(fileStatuses);
      setTotalFolders(plan.foldersToCreate.length);
      setTotalFiles(plan.filesToUpload.length);
      setCompletedFolders(0);
      setCompletedFiles(0);

      // Move to review step
      setCurrentStep("review");

      console.log("Upload plan:", plan);
    },
    []
  );

  const createFoldersSequentially = async () => {
    if (!uploadPlan) return false;

    const folderIdMap = new Map<string, string>();
    // Add current folder to map
    if (currentFolderId) {
      folderIdMap.set("", currentFolderId);
    }

    for (const folder of uploadPlan.foldersToCreate) {
      const statusId = `folder-${folder.path}`;

      try {
        // Update status to creating
        setFoldersStatus((prev) =>
          prev.map((f) =>
            f.id === statusId ? { ...f, status: "creating" } : f
          )
        );
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
        setFoldersStatus((prev) =>
          prev.map((f) =>
            f.id === statusId
              ? { ...f, status: "completed", createdId: result.id }
              : f
          )
        );
        setCompletedFolders((prev) => prev + 1);

        console.log(`Created folder: ${folder.name} with ID: ${result.id}`);
      } catch (error) {
        console.error(`Failed to create folder ${folder.name}:`, error);

        // Update status to error
        setFoldersStatus((prev) =>
          prev.map((f) =>
            f.id === statusId
              ? {
                  ...f,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : f
          )
        );

        toast.error(`Failed to create folder: ${folder.name}`);
        return false;
      }
    }

    return folderIdMap;
  };

  const uploadFilesSequentially = async (folderIdMap: Map<string, string>) => {
    if (!uploadPlan) return false;

    for (const file of uploadPlan.filesToUpload) {
      try {
        // Update status to uploading
        setFilesStatus((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "uploading", progress: 0 } : f
          )
        );
        setCurrentOperation(`Uploading file: ${file.name}`);

        // Determine parent folder ID
        const parentId =
          folderIdMap.get(file.parentPath || "") || currentFolderId;
        if (!parentId) {
          throw new Error("Parent folder not found");
        }

        // Simulate upload progress
        for (let progress = 10; progress <= 90; progress += 20) {
          setFilesStatus((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Upload file
        const success = await onFileUpload(file.file, file.name, parentId);

        if (!success) {
          throw new Error("Upload failed");
        }

        // Update status to completed
        setFilesStatus((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "completed", progress: 100 } : f
          )
        );
        setCompletedFiles((prev) => prev + 1);

        console.log(`Uploaded file: ${file.name}`);
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);

        // Update status to error
        setFilesStatus((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : f
          )
        );

        toast.error(`Failed to upload file: ${file.name}`);
        // Continue with other files instead of stopping
      }
    }

    return true;
  };

  const handleStartUpload = async () => {
    if (!uploadPlan || !folderStructure) return;

    setIsUploading(true);
    setCurrentStep("upload");
    setCurrentOperation("Starting upload...");

    try {
      // Step 1: Create all folders sequentially
      console.log("Creating folders...");
      const folderIdMap = await createFoldersSequentially();

      if (!folderIdMap) {
        toast.error("Folder creation failed. Upload cancelled.");
        return;
      }

      // Step 2: Upload all files sequentially
      console.log("Uploading files...");
      await uploadFilesSequentially(folderIdMap);

      // Complete
      setCurrentOperation("Upload completed!");
      setCurrentStep("complete");
      toast.success("Multi-level folder upload completed!");

      // Refresh parent data
      onComplete();
    } catch (error) {
      console.error("Upload process failed:", error);
      toast.error("Upload process failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Reset all state
    setCurrentStep("select");
    setFolderStructure(null);
    setUploadPlan(null);
    setFoldersStatus([]);
    setFilesStatus([]);
    setIsUploading(false);
    setCurrentOperation("");
    setTotalFolders(0);
    setTotalFiles(0);
    setCompletedFolders(0);
    setCompletedFiles(0);

    onOpenChange(false);
  };

  const renderFolderNode = (
    node: FolderNode,
    depth: number = 0
  ): React.ReactNode => {
    const paddingLeft = depth * 20;

    return (
      <div key={node.path} className="w-full">
        {node.name !== "Root" && (
          <div
            className="flex items-center py-1 px-2 text-sm"
            style={{ paddingLeft }}
          >
            <Folder className={`w-4 h-4 mr-2 ${currentTheme.primary}`} />
            <span className="font-medium">{node.name}</span>
            <span className="ml-2 text-xs text-gray-500">
              ({node.files.length} files)
            </span>
          </div>
        )}

        {/* Show subfolders */}
        {Object.values(node.subfolders).map((subfolder) =>
          renderFolderNode(subfolder, node.name === "Root" ? depth : depth + 1)
        )}

        {/* Show files */}
        {node.files.map((file) => (
          <div
            key={file.id}
            className="flex items-center py-1 px-2 text-xs text-gray-600"
            style={{
              paddingLeft:
                node.name === "Root" ? paddingLeft + 20 : paddingLeft + 40,
            }}
          >
            <FileText className="w-3 h-3 mr-2" />
            <span className="flex-1 truncate">{file.name}</span>
            <span className="text-xs">{formatFileSize(file.size)}</span>
          </div>
        ))}
      </div>
    );
  };

  const getOverallProgress = () => {
    const totalOperations = totalFolders + totalFiles;
    const completedOperations = completedFolders + completedFiles;
    return totalOperations > 0
      ? (completedOperations / totalOperations) * 100
      : 0;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderUp className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step: Select Folder */}
          {currentStep === "select" && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select a Folder</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose a folder with nested subfolders and files to upload
                </p>
                <Button
                  onClick={() =>
                    document.getElementById("multi-folder-upload")?.click()
                  }
                  className={currentTheme.button}
                >
                  <FolderUp className="w-4 h-4 mr-2" />
                  Select Folder
                </Button>
                <input
                  id="multi-folder-upload"
                  type="file"
                  multiple
                  {...({ webkitdirectory: "" } as any)}
                  onChange={handleFolderSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Step: Review */}
          {currentStep === "review" && uploadPlan && folderStructure && (
            <div className="space-y-4 py-4">
              {/* Summary */}
              <Card
                className={`${currentTheme.bg} ${currentTheme.border} border`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Upload Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {uploadPlan.totalFiles}
                      </div>
                      <div className="text-gray-600">Files</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {uploadPlan.foldersToCreate.length}
                      </div>
                      <div className="text-gray-600">Folders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatFileSize(uploadPlan.totalSize)}
                      </div>
                      <div className="text-gray-600">Total Size</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Folder Structure Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Folder Structure Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-48 overflow-y-auto">
                  {renderFolderNode(folderStructure)}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Upload Progress */}
          {currentStep === "upload" && (
            <div className="space-y-4 py-4">
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(getOverallProgress())}%</span>
                </div>
                <Progress value={getOverallProgress()} className="h-2" />
                <div className="text-xs text-gray-600 text-center">
                  {currentOperation}
                </div>
              </div>

              {/* Folder Creation Progress */}
              {totalFolders > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Creating Folders ({completedFolders}/{totalFolders})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {foldersStatus.map((folder) => (
                        <div key={folder.id} className="flex items-center text-xs">
                          <StatusDot status={folder.status} />
                          <span className="flex-1 truncate">{folder.name}</span>
                          {folder.error && (
                            <span className="text-red-500 ml-2">{folder.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File Upload Progress */}
              {totalFiles > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Uploading Files ({completedFiles}/{totalFiles})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-40 overflow-y-auto">
                    <div className="space-y-1">
                      {filesStatus.map((file) => (
                        <div key={file.id} className="space-y-1">
                          <div className="flex items-center text-xs">
                            <StatusDot status={file.status} />
                            <span className="flex-1 truncate">{file.name}</span>
                            {file.progress !== undefined && (
                              <span className="text-gray-500 ml-2">{file.progress}%</span>
                            )}
                          </div>
                          {file.status === "uploading" && file.progress !== undefined && (
                            <Progress value={file.progress} className="h-1" />
                          )}
                          {file.error && (
                            <div className="text-xs text-red-500 ml-5">{file.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step: Complete */}
          {currentStep === "complete" && (
            <div className="space-y-6 py-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <h3 className="text-lg font-medium mb-2">Upload Complete!</h3>
                <p className="text-sm text-gray-600">
                  Successfully uploaded {completedFiles} files in{" "}
                  {completedFolders} folders
                </p>
              </div>

              {/* Show any errors */}
              {filesStatus.some((f) => f.status === "error") && (
                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-800 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Some files failed to upload
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-red-700">
                      {filesStatus.filter((f) => f.status === "error").length}{" "}
                      files failed to upload. You can retry uploading these
                      files individually.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {currentStep === "select" && (
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          )}

          {currentStep === "review" && (
            <>
              <Button
                variant="outline"
                onClick={() => setCurrentStep("select")}
              >
                Back
              </Button>
              <Button
                onClick={handleStartUpload}
                className={currentTheme.button}
                disabled={!uploadPlan}
              >
                <Upload className="w-4 h-4 mr-2" />
                Start Upload
              </Button>
            </>
          )}

          {currentStep === "upload" && (
            <Button variant="outline" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload in Progress"}
            </Button>
          )}

          {currentStep === "complete" && (
            <Button onClick={handleClose} className={currentTheme.button}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
