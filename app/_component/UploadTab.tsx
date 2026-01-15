import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FileText,
  Upload,
  Download,
  Folder,
  ChevronRight,
  Plus,
  Archive,
} from "lucide-react";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

type FileRecord = {
  id: string;
  url: string;
  path: string;
  name: string | null;
  size: string | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  folderName?: string | null;
};

type SelectedFile = {
  name: string;
};

type UploadTabProps = {
  readonly uploadedFiles: FileRecord[];
  readonly folders: string[];
  readonly isLoading: boolean;
  readonly selectedFile: SelectedFile | null;
  readonly isUploading: boolean;
  readonly handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleFileUpload: () => void;
  readonly setSelectedFile: (file: null) => void;
  readonly currentPath: string;
  readonly onPathChange: (path: string) => void;
  readonly onFolderCreate: (folderName: string) => void;
  readonly onFileArchive: (fileId: string) => void;
};

const Breadcrumbs = ({
  path,
  setPath,
}: {
  path: string;
  setPath: (path: string) => void;
}) => {
  const parts = path.split("/").filter(Boolean);
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      <button onClick={() => setPath("")} className="hover:underline">
        All Folders
      </button>
      {parts.map((part, index) => {
        const current = parts.slice(0, index + 1).join("/");
        return (
          <React.Fragment key={current}>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => setPath(current)}
              className="hover:underline"
            >
              {part}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default function UploadTab({
  uploadedFiles,
  folders,
  isLoading,
  selectedFile,
  isUploading,
  handleFileSelect,
  handleFileUpload,
  setSelectedFile,
  currentPath,
  onPathChange,
  onFolderCreate,
  onFileArchive,
}: UploadTabProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const handleFolderDoubleClick = (folderName: string) => {
    onPathChange(currentPath ? `${currentPath}/${folderName}` : folderName);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      if (newFolderName.includes("/")) {
        toast.error("Folder name cannot contain '/'");
        return;
      }
      onFolderCreate(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Create new folders or upload files to the current directory (
            {currentPath || "root"}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
            <input
              type="file"
              onChange={handleFileSelect}
              id="file-upload"
              className="hidden"
            />
          </div>

          {showNewFolderInput && (
            <div className="flex gap-2 p-4 border rounded-lg">
              <Input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <Button size="sm" onClick={handleCreateFolder}>
                Create
              </Button>
            </div>
          )}

          {selectedFile && (
            <div className="flex items-center justify-between p-2 mt-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <p className="font-medium text-sm">{selectedFile.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleFileUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Confirm Upload"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* File Browser */}
      <Card>
        <CardHeader>
          <CardTitle>My Files</CardTitle>
          <CardDescription>
            Double-click folders to open them. Manage your uploaded files here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Breadcrumbs path={currentPath} setPath={onPathChange} />
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onDoubleClick={() => handleFolderDoubleClick(folder)}
                    onClick={() => handleFolderDoubleClick(folder)}
                    className="flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Folder className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500" />
                    <span className="mt-2 text-sm font-medium text-center truncate w-full">
                      {folder}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    className="flex items-center justify-between gap-3 p-2 border rounded-lg"
                    key={file.id}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {file.size} •{" "}
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        asChild
                      >
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFileArchive(file.id)}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {!isLoading &&
                uploadedFiles.length === 0 &&
                folders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      This folder is empty
                    </p>
                  </div>
                )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
