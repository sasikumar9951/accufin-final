"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  Upload,
} from "lucide-react";
import {
  FolderNode,
  FileItem,
  FolderUploadPlan,
  buildFolderStructure,
  extractAllFiles,
  createUploadPlan,
  formatFileSize,
  toggleFolderExpansion,
  getFolderStats,
} from "@/lib/folder-utils";

export default function TestFolderUpload() {
  const [folderStructure, setFolderStructure] = useState<FolderNode | null>(
    null
  );
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [uploadPlan, setUploadPlan] = useState<FolderUploadPlan | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log("Selected files:", files.length);

    let structure: FolderNode;
    
    // Handle empty folder case - when no files are selected but a folder is selected
    if (files.length === 0) {
      // Create a simple empty folder structure with a timestamp-based name
      const folderName = `New Folder ${new Date().toLocaleTimeString()}`;
      structure = {
        name: "Root",
        path: "",
        files: [],
        subfolders: {
          [folderName]: {
            name: folderName,
            path: folderName,
            files: [],
            subfolders: {},
            isExpanded: false,
            depth: 1,
            parentPath: "",
          }
        },
        isExpanded: true,
        depth: 0,
      };
    } else {
      // Build folder structure from files
      structure = buildFolderStructure(files);
    }

    setFolderStructure(structure);

    // Extract all files for easy access
    const allFiles = extractAllFiles(structure);
    setSelectedFiles(allFiles);

    // Create upload plan
    const plan = createUploadPlan(structure);
    setUploadPlan(plan);

    console.log("Folder structure:", structure);
    console.log("All files:", allFiles);
    console.log("Upload plan:", plan);
  };

  const toggleFolder = (targetPath: string) => {
    if (!folderStructure) return;
    const updatedStructure = toggleFolderExpansion(folderStructure, targetPath);
    setFolderStructure(updatedStructure);
  };

  const renderFolderNode = (
    node: FolderNode,
    depth: number = 0
  ): React.ReactNode => {
    const paddingLeft = depth * 20;
    const hasSubfolders = Object.keys(node.subfolders).length > 0;
    const ChevronIcon = node.isExpanded ? ChevronDown : ChevronRight;

    return (
      <div key={node.path} className="w-full">
        {/* Folder header */}
        {node.name !== "Root" && (
          <button
            type="button"
            className="flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer w-full text-left border-none bg-transparent"
            style={{ paddingLeft }}
            onClick={() => toggleFolder(node.path)}
            aria-expanded={node.isExpanded}
            aria-label={`${node.name} folder, ${node.files.length} files, ${Object.keys(node.subfolders).length} folders`}
          >
            {hasSubfolders ? (
              <ChevronIcon className="w-4 h-4 mr-2" />
            ) : (
              <div className="w-6 mr-2" />
            )}
            <Folder className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-medium">{node.name}</span>
            <span className="ml-2 text-sm text-gray-500">
              ({node.files.length} files, {Object.keys(node.subfolders).length}{" "}
              folders)
            </span>
          </button>
        )}

        {/* Show contents if expanded or if it's root */}
        {(node.isExpanded || node.name === "Root") && (
          <div>
            {/* Render subfolders */}
            {Object.values(node.subfolders).map((subfolder) =>
              renderFolderNode(
                subfolder,
                node.name === "Root" ? depth : depth + 1
              )
            )}

            {/* Render files */}
            {node.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center py-1 px-3 text-sm"
                style={{
                  paddingLeft:
                    node.name === "Root" ? paddingLeft : paddingLeft + 20,
                }}
              >
                <div className="w-6 mr-2" />
                <FileText className="w-4 h-4 mr-2 text-gray-600" />
                <span className="flex-1">{file.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleUpload = async () => {
    if (!folderStructure || !uploadPlan || selectedFiles.length === 0) return;

    setIsUploading(true);
    console.log("Starting upload process...");

    try {
      // Here we would implement the actual upload logic
      // For now, just simulate the process

      console.log("Upload plan:", uploadPlan);
      console.log("Folders to create:", uploadPlan.foldersToCreate);
      console.log("Files to upload:", uploadPlan.filesToUpload.length);

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert(
        `Successfully processed ${uploadPlan.totalFiles} files in ${uploadPlan.foldersToCreate.length} folders!`
      );
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed!");
    } finally {
      setIsUploading(false);
    }
  };

  const getStats = () => {
    if (!folderStructure) return null;
    return getFolderStats(folderStructure);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl md:pt-[120px] pt-[150px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Multi-Level Folder Upload Test
          </CardTitle>
          <p className="text-sm text-gray-600">
            Select a folder to see its complete structure with all nested
            folders and files
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Upload Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Button
                  onClick={() =>
                    document.getElementById("folder-upload")?.click()
                  }
                  className="w-full"
                  disabled={isUploading}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Select Folder
                </Button>
                <input
                  id="folder-upload"
                  type="file"
                  multiple
                  {...({ webkitdirectory: "" } as any)}
                  onChange={handleFolderSelect}
                  className="hidden"
                />
              </div>

              {selectedFiles.length > 0 && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full sm:w-auto"
                >
                  {isUploading
                    ? "Uploading..."
                    : `Upload ${selectedFiles.length} Files`}
                </Button>
              )}
            </div>

            {/* Summary */}
            {uploadPlan && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">
                  Upload Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">
                      Total Files:
                    </span>{" "}
                    {uploadPlan.totalFiles}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">
                      Total Size:
                    </span>{" "}
                    {formatFileSize(uploadPlan.totalSize)}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Folders:</span>{" "}
                    {uploadPlan.foldersToCreate.length}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">
                      Max Depth:
                    </span>{" "}
                    {getStats()?.maxDepth || 0}
                  </div>
                </div>
              </div>
            )}

            {/* Upload Plan Details */}
            {uploadPlan && uploadPlan.foldersToCreate.length > 0 && (
              <Card className="border-2 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800">
                    Upload Plan - Folders to Create (
                    {uploadPlan.foldersToCreate.length})
                  </CardTitle>
                  <p className="text-sm text-green-600">
                    These folders will be created in the correct order
                  </p>
                </CardHeader>
                <CardContent className="max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {uploadPlan.foldersToCreate.map((folder, index) => (
                      <div
                        key={folder.path}
                        className="flex items-center py-2 px-3 bg-green-50 rounded text-sm"
                      >
                        <span className="text-green-600 font-mono text-xs mr-3 w-8">
                          {index + 1}.
                        </span>
                        <Folder className="w-4 h-4 mr-2 text-green-600" />
                        <span className="font-medium">{folder.name}</span>
                        <span className="ml-2 text-xs text-green-500">
                          {folder.path}
                        </span>
                        {folder.parentPath && (
                          <span className="ml-auto text-xs text-green-400">
                            parent: {folder.parentPath}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Folder Structure Display */}
            {folderStructure && (
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Folder Structure Preview
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Click on folders to expand/collapse them
                  </p>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  {renderFolderNode(folderStructure)}
                </CardContent>
              </Card>
            )}

            {/* File List */}
            {selectedFiles.length > 0 && (
              <Card className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    All Files ({selectedFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto">
                  <div className="space-y-1">
                    {selectedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <FileText className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
                          <span className="truncate font-medium">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="truncate max-w-xs">
                            {file.relativePath}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {!folderStructure && (
              <div className="text-center py-12 text-gray-500">
                <Folder className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Folder Selected</h3>
                <p className="text-sm">
                  Click "Select Folder" to choose a folder and see its complete
                  structure
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
