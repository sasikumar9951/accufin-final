import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import {
  FileText,
  Upload,
  Download,
  Folder,
  ChevronRight,
  Plus,
  Archive,
  ArchiveRestore,
  FolderUp,
  RotateCw,
  Copy,
  Scissors,
  Clipboard,
  X,
  CheckSquare,
  Square,
  MoreVertical,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { ManagedFile } from "@/types/files";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MultiLevelFolderUpload from "./MultiLevelFolderUpload";

type Folder = {
  id: string;
  name: string;
};

// Reusable selection checkbox to avoid duplication
const SelectionCheckbox = ({
  isSelected,
  ariaLabel,
  onClick,
}: {
  isSelected: boolean;
  ariaLabel: string;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    className="cursor-pointer bg-transparent border-none p-0"
    aria-label={ariaLabel}
    onClick={onClick}
  >
    {isSelected ? (
      <CheckSquare className="w-5 h-5 text-blue-600" />
    ) : (
      <Square className="w-5 h-5 text-gray-400" />
    )}
  </button>
);

// Helper component for folder items
const FolderItem = ({
  folder,
  isSelected,
  isInClipboard,
  clipboardOperation,
  isSelectionMode,
  currentTheme,
  onToggleItemSelection,
  onFolderDoubleClick,
  onRenameFolder,
  onDeleteFolder,
  onFolderArchive,
  onFolderUnarchive,
  theme,
  openRenameFolderDialog,
  openDeleteFolderDialog,
}: {
  folder: Folder;
  isSelected: boolean;
  isInClipboard: boolean;
  clipboardOperation: "copy" | "cut" | null;
  isSelectionMode: boolean;
  currentTheme: any;
  onToggleItemSelection?: (itemId: string, itemType: "file" | "folder") => void;
  onFolderDoubleClick: (folderId: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onFolderArchive?: (folderId: string) => void;
  onFolderUnarchive?: (folderId: string) => void;
  theme: string;
  openRenameFolderDialog: (folderId: string, folderName: string) => void;
  openDeleteFolderDialog: (folderId: string) => void;
}) => {
  const getClassName = () => {
    if (isSelected) {
      return "bg-blue-50 border-blue-300";
    }
    if (isInClipboard && clipboardOperation === "cut") {
      return "opacity-50";
    }
    return `${currentTheme.border} ${currentTheme.hover}`;
  };

  return (
    <div
      key={folder.id}
      className={`flex items-center p-3 border rounded-lg transition-colors ${getClassName()} ${
        isSelectionMode ? "" : "cursor-pointer"
      }`}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && onToggleItemSelection && (
        <div className="mr-3">
          <SelectionCheckbox
            isSelected={isSelected}
            ariaLabel={`${isSelected ? "Deselect" : "Select"} folder ${folder.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleItemSelection(folder.id, "folder");
            }}
          />
        </div>
      )}

      <button
        onClick={() => !isSelectionMode && onFolderDoubleClick(folder.id)}
        className="flex items-center flex-1 min-w-0 bg-transparent border-none p-0 text-left"
        disabled={isSelectionMode}
        aria-label={`Open folder ${folder.name}`}
      >
        <Folder
          className={`w-6 h-6 ${currentTheme.folder} flex-shrink-0 mr-3`}
        />
        <span className="text-sm font-medium truncate flex-1">
          {folder.name}
        </span>
      </button>
      {(onRenameFolder ||
        onDeleteFolder ||
        onFolderArchive ||
        onFolderUnarchive) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onRenameFolder && theme !== "archive" && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openRenameFolderDialog(folder.id, folder.name);
                }}
              >
                Rename
              </DropdownMenuItem>
            )}
            {onFolderArchive && theme !== "archive" && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onFolderArchive(folder.id);
                }}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
            {onFolderUnarchive && theme === "archive" && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onFolderUnarchive(folder.id);
                }}
              >
                <ArchiveRestore className="w-4 h-4 mr-2" />
                Unarchive
              </DropdownMenuItem>
            )}
            {onDeleteFolder && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteFolderDialog(folder.id);
                }}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

// Helper component for file items
const FileItem = ({
  file,
  isSelected,
  isInClipboard,
  clipboardOperation,
  isSelectionMode,
  currentTheme,
  onToggleItemSelection,
  onRenameFile,
  onDeleteFile,
  onFileArchive,
  onFileUnarchive,
  openRenameFileDialog,
  openDeleteFileDialog,
}: {
  file: ManagedFile;
  isSelected: boolean;
  isInClipboard: boolean;
  clipboardOperation: "copy" | "cut" | null;
  isSelectionMode: boolean;
  currentTheme: any;
  onToggleItemSelection?: (itemId: string, itemType: "file" | "folder") => void;
  onRenameFile?: (fileId: string, newName: string) => void;
  onDeleteFile?: (fileId: string) => void;
  onFileArchive?: (fileId: string) => void;
  onFileUnarchive?: (fileId: string) => void;
  openRenameFileDialog: (fileId: string, currentName: string) => void;
  openDeleteFileDialog: (fileId: string, fileName: string) => void;
}) => {
  const getClassName = () => {
    if (isSelected) {
      return "bg-blue-50 border-blue-300";
    }
    if (isInClipboard && clipboardOperation === "cut") {
      return "opacity-50 border-gray-300";
    }
    return currentTheme.border;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border-2 rounded-lg ${getClassName()}`}
      key={file.id}
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {/* Selection Checkbox */}
        {isSelectionMode && onToggleItemSelection && (
          <SelectionCheckbox
            isSelected={isSelected}
            ariaLabel={`${isSelected ? "Deselect" : "Select"} file ${file.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleItemSelection(file.id, "file");
            }}
          />
        )}

        <FileText className={`w-6 h-6 ${currentTheme.file} flex-shrink-0`} />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate text-sm">{file.name}</p>
          {file.size && file.createdAt && (
            <p className="text-xs text-gray-500 truncate">
              {file.size} • {new Date(file.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-stretch sm:items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={`whitespace-nowrap w-full sm:w-auto ${currentTheme.border} ${currentTheme.hover}`}
          asChild
        >
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <Download className="w-4 h-4 mr-2" />
            Download
          </a>
        </Button>
        {onFileArchive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFileArchive(file.id)}
            className="w-full sm:w-auto"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
        )}
        {onFileUnarchive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFileUnarchive(file.id)}
            className="w-full sm:w-auto"
          >
            <ArchiveRestore className="w-4 h-4 mr-2" />
            Unarchive
          </Button>
        )}
        {(onRenameFile || onDeleteFile) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRenameFile && (
                <DropdownMenuItem
                  onClick={() => openRenameFileDialog(file.id, file.name)}
                >
                  Rename
                </DropdownMenuItem>
              )}
              {onDeleteFile && (
                <DropdownMenuItem
                  onClick={() => openDeleteFileDialog(file.id, file.name)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

type ClipboardItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  parentFolderId: string | null;
};

type FileBrowserProps = {
  files: ManagedFile[];
  folders: Folder[];
  isLoading: boolean;
  currentFolderId: string | null;
  onFolderChange: (folderId: string | null) => void;
  onFolderCreate?: (folderName: string) => void;
  onRenameFile?: (fileId: string, newName: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFile?: (fileId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  isUploading: boolean;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Upload a specific selected file by its temp id
  handleFileUpload: (selectedTempId: string) => void;
  // Upload all selected files sequentially
  handleConfirmAll?: () => void;
  // Selected files (local, prior to upload)
  selectedFiles: { id: string; name: string }[];
  // Remove a selected file from the queue
  onRemoveSelectedFile: (selectedTempId: string) => void;
  // Clear all selected files
  onClearSelectedFiles?: () => void;
  onSelectedFileNameChange?: (selectedTempId: string, newName: string) => void;
  onFileArchive?: (fileId: string) => void;
  onFileUnarchive?: (fileId: string) => void;
  onFolderArchive?: (folderId: string) => void;
  onFolderUnarchive?: (folderId: string) => void;
  // Trigger a data refresh in parent
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  showUploadButton?: boolean;
  showAddFolderButton?: boolean;
  showUploadFolderButton?: boolean;
  theme?: "user" | "admin-private" | "admin-response" | "archive";
  // Optional per-file uploading status (ids currently uploading)
  uploadingIds?: string[];
  // Track when batch upload (Confirm All) is in progress
  isBatchUploading?: boolean;
  // Breadcrumb path for display purposes
  breadcrumbPath?: { id: string; name: string }[];
  // Multi-level folder upload
  onMultiLevelFolderCreate?: (
    name: string,
    parentId: string | null
  ) => Promise<{ id: string }>;
  onMultiLevelFileUpload?: (
    file: File,
    name: string,
    parentId: string
  ) => Promise<boolean>;
  showMultiLevelUploadButton?: boolean;
  // Clipboard operations
  clipboardItems?: ClipboardItem[];
  clipboardOperation?: "copy" | "cut" | null;
  onCopyItems?: (items: ClipboardItem[]) => void;
  onCutItems?: (items: ClipboardItem[]) => void;
  onPasteItems?: (targetFolderId: string | null) => void;
  onClearClipboard?: () => void;
  // Selection for bulk operations
  selectedItemsForClipboard?: string[]; // file/folder IDs
  onToggleItemSelection?: (itemId: string, itemType: "file" | "folder") => void;
  onSelectAllItems?: () => void;
  onClearSelection?: () => void;
  showClipboardActions?: boolean;
  isPasting?: boolean;
  // Storage gating
  storageUsedKB?: number;
  maxStorageLimitKB?: number;
  showStorageBanner?: boolean;
  onDismissStorageBanner?: () => void;
  storageSubjectName?: string; // Optional name to show in banner (e.g., user's name)
};

// Storage Banner Component
const StorageBanner = ({
  isAtLeast90,
  isFull,
  showStorageBanner,
  percentUsed,
  storageSubjectName,
  onDismissStorageBanner,
}: {
  isAtLeast90: boolean;
  isFull: boolean;
  showStorageBanner: boolean;
  percentUsed: number;
  storageSubjectName?: string;
  onDismissStorageBanner?: () => void;
}) => {
  if (!((isAtLeast90 || isFull) && showStorageBanner)) return null;

  return (
    <div
      className={`flex items-start justify-between p-3 border rounded-md ${isFull ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-300"}`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 w-5 h-5 flex items-center justify-center rounded-full ${isFull ? "bg-red-500" : "bg-amber-500"} text-white text-xs font-bold`}
        >
          i
        </div>
        <div className="text-sm">
          {isFull ? (
            <>
              {storageSubjectName
                ? `${storageSubjectName}'s storage is full (${percentUsed}%).`
                : `Your storage is full (${percentUsed}%).`}{" "}
              You cannot upload or copy until you free space.
            </>
          ) : (
            <>
              {storageSubjectName
                ? `${storageSubjectName} is using ${percentUsed}% of their storage.`
                : `You are using ${percentUsed}% of your storage.`}{" "}
              Consider freeing space.
            </>
          )}
        </div>
      </div>
      {onDismissStorageBanner && (
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={onDismissStorageBanner}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Selected Files Section Component
const SelectedFilesSection = ({
  selectedFiles,
  handleConfirmAll,
  isUploading,
  uploadingIds,
  isBatchUploading,
  hasNameConflicts,
  onClearSelectedFiles,
  handleFileUpload,
  onRemoveSelectedFile,
  onSelectedFileNameChange,
  currentTheme,
}: {
  selectedFiles: { id: string; name: string }[];
  handleConfirmAll?: () => void;
  isUploading: boolean;
  uploadingIds: string[];
  isBatchUploading: boolean;
  hasNameConflicts: boolean;
  onClearSelectedFiles?: () => void;
  handleFileUpload: (selectedTempId: string) => void;
  onRemoveSelectedFile: (selectedTempId: string) => void;
  onSelectedFileNameChange?: (selectedTempId: string, newName: string) => void;
  currentTheme: any;
}) => {
  if (!selectedFiles || selectedFiles.length === 0) return null;

  return (
    <div
      className={`p-3 mb-4 rounded-lg border gap-3 ${currentTheme.bg} ${currentTheme.border}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <p className="font-medium text-sm">
          {selectedFiles.length} file(s) selected
        </p>
        <div className="flex flex-wrap gap-2">
          {handleConfirmAll && (
            <Button
              size="sm"
              onClick={handleConfirmAll}
              disabled={
                isUploading ||
                uploadingIds.length > 0 ||
                isBatchUploading ||
                hasNameConflicts
              }
            >
              {isBatchUploading ? "Uploading All..." : "Confirm All"}
            </Button>
          )}
          {onClearSelectedFiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClearSelectedFiles()}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {selectedFiles.map((sf) => {
          const isUploadingThis = uploadingIds.includes(sf.id);
          const disabled = isUploadingThis || isBatchUploading;
          const dotIndex = (sf.name || "").lastIndexOf(".");
          const ext = dotIndex > 0 ? sf.name.slice(dotIndex + 1) : "";
          const base = dotIndex > 0 ? sf.name.slice(0, dotIndex) : sf.name;

          return (
            <div
              key={sf.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 rounded-md border"
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <FileText
                  className={`w-5 h-5 ${currentTheme.file} flex-shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{sf.name}</p>
                  {onSelectedFileNameChange && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="text"
                        defaultValue={base}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          if (raw.includes("/")) {
                            toast.error("Name cannot contain '/'");
                            return;
                          }
                          const newName = ext ? `${raw}.${ext}` : raw;
                          if (raw.length === 0) return;
                          onSelectedFileNameChange(sf.id, newName);
                        }}
                        className="h-8 w-48"
                      />
                      {ext && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          .{ext}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-stretch sm:items-center gap-2 mt-2 sm:mt-0">
                <Button
                  size="sm"
                  onClick={() => handleFileUpload(sf.id)}
                  disabled={disabled}
                  className="w-full sm:w-auto"
                >
                  {isUploadingThis ? "Uploading..." : "Confirm Upload"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSelectedFile(sf.id)}
                  disabled={isBatchUploading}
                  className="w-full sm:w-auto"
                >
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Dialog Components
const NewFolderDialog = ({
  open,
  onOpenChange,
  newFolderName,
  setNewFolderName,
  onCreateFolder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  onCreateFolder: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Folder</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <Input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Folder name"
          onKeyDown={(e) => e.key === "Enter" && onCreateFolder()}
        />
      </div>
      <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <Button onClick={onCreateFolder} className="w-full sm:w-auto">
          Create
        </Button>
        <DialogClose asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const RenameDialog = ({
  open,
  onClose,
  isFolder,
  newName,
  setNewName,
  originalExt,
  onConfirm,
  currentTheme,
}: {
  open: boolean;
  onClose: () => void;
  isFolder: boolean;
  newName: string;
  setNewName: (name: string) => void;
  originalExt: string | null;
  onConfirm: () => void;
  currentTheme: any;
}) => (
  <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      className={`sm:max-w-md ${currentTheme.card} ${currentTheme.cardBorder} border`}
    >
      <DialogHeader>
        <DialogTitle className={`${currentTheme.headerText}`}>
          Rename {isFolder ? "Folder" : "File"}
        </DialogTitle>
      </DialogHeader>
      <div className="py-4">
        {isFolder ? (
          <Input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New folder name"
            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New file name"
              onKeyDown={(e) => e.key === "Enter" && onConfirm()}
            />
            {originalExt && (
              <span className="text-sm text-gray-500 whitespace-nowrap">
                .{originalExt}
              </span>
            )}
          </div>
        )}
      </div>
      <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <Button onClick={onConfirm} className={`w-full sm:w-auto`}>
          Rename
        </Button>
        <DialogClose asChild>
          <Button
            variant="outline"
            className={`w-full sm:w-auto ${currentTheme.border}`}
          >
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const DeleteDialog = ({
  open,
  onClose,
  isFolder,
  fileName,
  onConfirm,
  currentTheme,
}: {
  open: boolean;
  onClose: () => void;
  isFolder: boolean;
  fileName: string | null;
  onConfirm: () => void;
  currentTheme: any;
}) => (
  <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      className={`sm:max-w-md ${currentTheme.card} ${currentTheme.cardBorder} border`}
    >
      <DialogHeader>
        <DialogTitle className={`${currentTheme.headerText}`}>
          Confirm Delete
        </DialogTitle>
      </DialogHeader>
      <div className="py-2 text-sm">
        {isFolder ? (
          <p>
            Are you sure you want to delete this folder and all its contents?
          </p>
        ) : (
          <p>Are you sure you want to delete the file "{fileName}"?</p>
        )}
      </div>
      <DialogFooter className="flex flex-col sm:flex-row gap-2">
        <DialogClose asChild>
          <Button
            variant="outline"
            className={`w-full sm:w-auto ${currentTheme.border}`}
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          onClick={onConfirm}
          className="w-full sm:w-auto"
          variant="destructive"
        >
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const Breadcrumbs = ({
  breadcrumbPath,
  onFolderChange,
  theme = "user",
}: {
  breadcrumbPath: { id: string; name: string }[];
  onFolderChange: (folderId: string | null) => void;
  theme?: string;
}) => {
  const breadcrumbColors = {
    user: "text-blue-600",
    "admin-private": "text-purple-600",
    "admin-response": "text-green-600",
    archive: "text-gray-600",
  };

  const currentColor =
    breadcrumbColors[theme as keyof typeof breadcrumbColors] || "text-gray-500";

  return (
    <div
      className={`flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm overflow-x-auto pb-1 ${currentColor}`}
    >
      <button
        onClick={() => onFolderChange(null)}
        className="hover:underline whitespace-nowrap"
      >
        All Folders
      </button>
      {breadcrumbPath.map((folder) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <button
            onClick={() => onFolderChange(folder.id)}
            className="hover:underline whitespace-nowrap"
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default function FileBrowser({
  files,
  folders,
  isLoading,
  currentFolderId,
  onFolderChange,
  onFolderCreate,
  onRenameFile,
  onRenameFolder,
  onDeleteFile,
  onDeleteFolder,
  isUploading,
  handleFileSelect,
  handleFileUpload,
  handleConfirmAll,
  selectedFiles,
  onRemoveSelectedFile,
  onClearSelectedFiles,
  onSelectedFileNameChange,
  onFileArchive,
  onFileUnarchive,
  onFolderArchive,
  onFolderUnarchive,
  onRefresh,
  isRefreshing = false,
  showUploadButton = true,
  showAddFolderButton = true,
  theme = "user",
  uploadingIds = [],
  isBatchUploading = false,
  breadcrumbPath = [],
  onMultiLevelFolderCreate,
  onMultiLevelFileUpload,
  showMultiLevelUploadButton = false,
  // Clipboard props
  clipboardItems = [],
  clipboardOperation = null,
  onCopyItems,
  onCutItems,
  onPasteItems,
  onClearClipboard,
  selectedItemsForClipboard = [],
  onToggleItemSelection,
  onSelectAllItems,
  onClearSelection,
  showClipboardActions = false,
  isPasting = false,
  storageUsedKB,
  maxStorageLimitKB,
  showStorageBanner = true,
  onDismissStorageBanner,
  storageSubjectName,
}: Readonly<FileBrowserProps>) {
  const percentUsed = useMemo(() => {
    if (!maxStorageLimitKB || maxStorageLimitKB <= 0) return 0;
    const used = storageUsedKB || 0;
    const epsilon = Math.max(1, Math.ceil(maxStorageLimitKB * 0.001));
    if (used + epsilon >= maxStorageLimitKB) return 100;
    return Math.floor((used / maxStorageLimitKB) * 100);
  }, [storageUsedKB, maxStorageLimitKB]);

  const isAtLeast90 =
    maxStorageLimitKB &&
    maxStorageLimitKB > 0 &&
    percentUsed >= 90 &&
    percentUsed < 100;
  const isFull =
    maxStorageLimitKB && maxStorageLimitKB > 0 && percentUsed >= 100;

  const [newFolderName, setNewFolderName] = useState("");
  const [isRefreshingState, setIsRefreshingState] = useState(isRefreshing);
  const [renameTargetFileId, setRenameTargetFileId] = useState<string | null>(
    null
  );
  const [renameTargetFolderId, setRenameTargetFolderId] = useState<
    string | null
  >(null);
  const [renameNewName, setRenameNewName] = useState("");
  const [renameOriginalExt, setRenameOriginalExt] = useState<string | null>(
    null
  );
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [deleteTargetFileId, setDeleteTargetFileId] = useState<string | null>(
    null
  );
  const [deleteTargetFileName, setDeleteTargetFileName] = useState<
    string | null
  >(null);
  const [deleteTargetFolderId, setDeleteTargetFolderId] = useState<
    string | null
  >(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMultiLevelUploadDialog, setShowMultiLevelUploadDialog] =
    useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Keep local refreshing spinner in sync with parent prop changes
  useEffect(() => {
    setIsRefreshingState(Boolean(isRefreshing));
  }, [isRefreshing]);

  // Auto-rename selected files that conflict with existing names in this folder
  useEffect(() => {
    if (
      !onSelectedFileNameChange ||
      !selectedFiles ||
      selectedFiles.length === 0
    )
      return;
    const existingNames = new Set(
      (files || []).map((f) => (f.name || "").toLowerCase())
    );
    const usedNames = new Set<string>();

    const generateUniqueName = (proposedName: string): string => {
      const dotIndex = (proposedName || "").lastIndexOf(".");
      const ext = dotIndex > 0 ? proposedName.slice(dotIndex + 1) : "";
      const base =
        dotIndex > 0 ? proposedName.slice(0, dotIndex) : proposedName;
      let i = 1;
      let candidate = proposedName;
      while (
        existingNames.has(candidate.toLowerCase()) ||
        usedNames.has(candidate.toLowerCase())
      ) {
        const numbered = `${base} (${i})` + (ext ? `.${ext}` : "");
        candidate = numbered;
        i += 1;
      }
      return candidate;
    };

    // Determine and apply unique names for the current selection order
    for (const sf of selectedFiles) {
      const currentName = sf.name || "Unnamed File";
      let finalName = currentName;
      if (
        existingNames.has(currentName.toLowerCase()) ||
        usedNames.has(currentName.toLowerCase())
      ) {
        finalName = generateUniqueName(currentName);
      }
      usedNames.add(finalName.toLowerCase());
      if (finalName !== currentName) {
        onSelectedFileNameChange(sf.id, finalName);
      }
    }
  }, [selectedFiles, files, onSelectedFileNameChange]);

  // Disable Confirm All when any selected name still conflicts (safety net)
  const hasNameConflicts = useMemo(() => {
    const existing = new Set(
      (files || []).map((f) => (f.name || "").toLowerCase())
    );
    const seen = new Set<string>();
    for (const sf of selectedFiles || []) {
      const nm = (sf.name || "").toLowerCase();
      if (!nm) return true;
      if (existing.has(nm) || seen.has(nm)) return true;
      seen.add(nm);
    }
    return false;
  }, [files, selectedFiles]);

  // Files filtered by the search query (within the current folder only)
  const filteredFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return files;
    return files.filter((f) => (f.name || "").toLowerCase().includes(query));
  }, [files, searchQuery]);

  // Folders filtered by the search query (within the current folder only)
  const filteredFolders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return folders;
    return folders.filter((f) => (f.name || "").toLowerCase().includes(query));
  }, [folders, searchQuery]);

  // Decide which arrays to render based on whether searching
  const isSearching = searchQuery.trim().length > 0;
  const foldersToRender = isSearching ? filteredFolders : folders;
  const filesToRender = isSearching ? filteredFiles : files;

  // Color theme system
  const colorTheme = {
    user: {
      folder: "text-blue-700",
      file: "text-blue-800",
      bg: "bg-blue-50",
      border: "border-blue-300",
      hover: "hover:bg-blue-100",
      card: "bg-blue-50",
      cardBorder: "border-blue-400",
      headerBg: "bg-blue-100",
      headerText: "text-blue-900",
    },
    "admin-private": {
      folder: "text-purple-700",
      file: "text-purple-800",
      bg: "bg-purple-50",
      border: "border-purple-300",
      hover: "hover:bg-purple-100",
      card: "bg-purple-50",
      cardBorder: "border-purple-400",
      headerBg: "bg-purple-100",
      headerText: "text-purple-900",
    },
    "admin-response": {
      folder: "text-green-700",
      file: "text-green-800",
      bg: "bg-green-50",
      border: "border-green-300",
      hover: "hover:bg-green-100",
      card: "bg-green-50",
      cardBorder: "border-green-400",
      headerBg: "bg-green-100",
      headerText: "text-green-900",
    },
    archive: {
      folder: "text-amber-700",
      file: "text-amber-800",
      bg: "bg-amber-50",
      border: "border-amber-300",
      hover: "hover:bg-amber-100",
      card: "bg-amber-50",
      cardBorder: "border-amber-400",
      headerBg: "bg-amber-100",
      headerText: "text-amber-900",
    },
  } as const;

  const currentTheme = colorTheme[theme];

  // Simple drag and drop handlers - no UI feedback
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const filesDropped = Array.from(e.dataTransfer.files);
    if (filesDropped.length > 0) {
      // Create the exact same event structure that the file input would create
      const fakeEvent = {
        target: {
          files: {
            length: filesDropped.length,
            item: (i: number) => filesDropped[i],
            0: filesDropped[0],
          } as unknown as FileList,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      handleFileSelect(fakeEvent);
    }
  };

  // handleFolderSelect removed - replaced by Multi-Level Upload functionality

  const handleFolderDoubleClick = (folderId: string) => {
    onFolderChange(folderId);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() && onFolderCreate) {
      if (newFolderName.includes("/")) {
        toast.error("Folder name cannot contain '/'");
        return;
      }
      const base = newFolderName.trim();
      const existingNames = new Set(
        folders.map((f) => (f.name || "").toLowerCase())
      );
      let finalName = base;
      if (existingNames.has(base.toLowerCase())) {
        for (let i = 1; i < 1000; i++) {
          const candidate = `${base} (${i})`;
          if (!existingNames.has(candidate.toLowerCase())) {
            finalName = candidate;
            break;
          }
        }
      }
      onFolderCreate(finalName);
      setNewFolderName("");
      setShowNewFolderDialog(false);
    }
  };

  const openRenameFileDialog = (fileId: string, currentName: string) => {
    setRenameTargetFileId(fileId);
    setRenameTargetFolderId(null);
    const dotIndex = currentName.lastIndexOf(".");
    const ext = dotIndex > 0 ? currentName.slice(dotIndex + 1) : "";
    const base = dotIndex > 0 ? currentName.slice(0, dotIndex) : currentName;
    setRenameNewName(base);
    setRenameOriginalExt(ext || null);
  };

  const openRenameFolderDialog = (folderId: string, folderName: string) => {
    setRenameTargetFileId(null);
    setRenameTargetFolderId(folderId);
    setRenameNewName(folderName);
    setRenameOriginalExt(null);
  };

  const confirmRename = () => {
    if (!renameNewName.trim() || renameNewName.includes("/")) {
      toast.error("Name cannot be empty or contain '/'");
      return;
    }
    if (renameTargetFileId && onRenameFile) {
      const base = renameNewName.trim();
      const finalName = renameOriginalExt
        ? `${base}.${renameOriginalExt}`
        : base;
      onRenameFile(renameTargetFileId, finalName);
    } else if (renameTargetFolderId && onRenameFolder) {
      onRenameFolder(renameTargetFolderId, renameNewName.trim());
    }
    setRenameTargetFileId(null);
    setRenameTargetFolderId(null);
    setRenameNewName("");
    setRenameOriginalExt(null);
  };

  const openDeleteFileDialog = (fileId: string, fileName: string) => {
    setDeleteTargetFileId(fileId);
    setDeleteTargetFileName(fileName);
    setDeleteTargetFolderId(null);
    setShowDeleteDialog(true);
  };

  const openDeleteFolderDialog = (folderId: string) => {
    setDeleteTargetFileId(null);
    setDeleteTargetFileName(null);
    setDeleteTargetFolderId(folderId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteTargetFileId && onDeleteFile) {
      onDeleteFile(deleteTargetFileId);
    } else if (deleteTargetFolderId && onDeleteFolder) {
      onDeleteFolder(deleteTargetFolderId);
    }
    setShowDeleteDialog(false);
    setDeleteTargetFileId(null);
    setDeleteTargetFileName(null);
    setDeleteTargetFolderId(null);
  };

  // Clipboard action handlers
  const handleCopySelected = () => {
    if (!onCopyItems || selectedItemsForClipboard.length === 0) return;

    const clipboardItems: ClipboardItem[] = [];

    // Add selected files
    for (const file of files) {
      if (selectedItemsForClipboard.includes(file.id)) {
        clipboardItems.push({
          id: file.id,
          name: file.name,
          type: "file",
          parentFolderId: file.parentFolderId || null,
        });
      }
    }

    // Add selected folders
    for (const folder of folders) {
      if (selectedItemsForClipboard.includes(folder.id)) {
        clipboardItems.push({
          id: folder.id,
          name: folder.name,
          type: "folder",
          parentFolderId: currentFolderId,
        });
      }
    }

    onCopyItems(clipboardItems);
    toast.success(`${clipboardItems.length} item(s) copied to clipboard`);
  };

  const handleCutSelected = () => {
    if (!onCutItems || selectedItemsForClipboard.length === 0) return;

    const clipboardItems: ClipboardItem[] = [];

    // Add selected files
    for (const file of files) {
      if (selectedItemsForClipboard.includes(file.id)) {
        clipboardItems.push({
          id: file.id,
          name: file.name,
          type: "file",
          parentFolderId: file.parentFolderId || null,
        });
      }
    }

    // Add selected folders
    for (const folder of folders) {
      if (selectedItemsForClipboard.includes(folder.id)) {
        clipboardItems.push({
          id: folder.id,
          name: folder.name,
          type: "folder",
          parentFolderId: currentFolderId,
        });
      }
    }

    onCutItems(clipboardItems);
    toast.success(`${clipboardItems.length} item(s) cut to clipboard`);
  };

  const handlePaste = () => {
    if (!onPasteItems || !clipboardItems || clipboardItems.length === 0) return;
    onPasteItems(currentFolderId);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode && onClearSelection) {
      onClearSelection();
    }
  };

  const handleSelectAll = () => {
    if (!onSelectAllItems) return;
    onSelectAllItems();
  };

  const isItemSelected = (itemId: string) => {
    return selectedItemsForClipboard.includes(itemId);
  };

  const isItemInClipboard = (itemId: string) => {
    return clipboardItems.some((item) => item.id === itemId);
  };

  return (
    <>
      <NewFolderDialog
        open={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onCreateFolder={handleCreateFolder}
      />

      <RenameDialog
        open={Boolean(renameTargetFileId || renameTargetFolderId)}
        onClose={() => {
          setRenameTargetFileId(null);
          setRenameTargetFolderId(null);
          setRenameNewName("");
        }}
        isFolder={Boolean(renameTargetFolderId)}
        newName={renameNewName}
        setNewName={setRenameNewName}
        originalExt={renameOriginalExt}
        onConfirm={confirmRename}
        currentTheme={currentTheme}
      />

      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteTargetFileId(null);
          setDeleteTargetFileName(null);
          setDeleteTargetFolderId(null);
        }}
        isFolder={Boolean(deleteTargetFolderId)}
        fileName={deleteTargetFileName}
        onConfirm={confirmDelete}
        currentTheme={currentTheme}
      />

      <section
        className="relative"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        aria-label="File upload drop zone"
      >
        <Card className={`shadow-none border-0 ${currentTheme.bg} gap-0`}>
          <CardHeader
            className={`border-0 ${currentTheme.headerBg} ${currentTheme.headerText} ${currentTheme.bg}`}
          >
            <div className="space-y-4">
              {/* Title and Breadcrumbs */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl">
                    File Management
                  </CardTitle>
                </div>
              </div>

              {/* Search and Action Buttons */}
              <div className="flex flex-col gap-3">
                {/* Search Bar */}
                <div className="w-full">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in this folder..."
                    className="h-9 max-w-md"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        setIsRefreshingState(true);
                        // Ensure a minimum 1s fake refresh, and run real refresh if provided
                        const minDelay = new Promise((resolve) =>
                          setTimeout(resolve, 1000)
                        );
                        const refreshPromise = onRefresh
                          ? Promise.resolve(onRefresh())
                          : Promise.resolve();
                        await Promise.all([minDelay, refreshPromise]);
                      } finally {
                        setIsRefreshingState(false);
                      }
                    }}
                    disabled={isRefreshingState}
                    className={`${currentTheme.border} ${currentTheme.hover}`}
                  >
                    <RotateCw
                      className={`w-4 h-4 mr-2 ${isRefreshingState ? "animate-spin" : ""}`}
                    />
                    {isRefreshingState ? "Refreshing..." : "Refresh"}
                  </Button>

                  {/* Clipboard Actions */}
                  {showClipboardActions && (
                    <>
                      <Button
                        variant={isSelectionMode ? "default" : "outline"}
                        size="sm"
                        onClick={toggleSelectionMode}
                        className={`${currentTheme.border} ${currentTheme.hover}`}
                      >
                        {isSelectionMode ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Exit Select
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Select
                          </>
                        )}
                      </Button>

                      {isSelectionMode && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            className={`${currentTheme.border} ${currentTheme.hover}`}
                          >
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Select All
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopySelected}
                            disabled={selectedItemsForClipboard.length === 0}
                            className={`${currentTheme.border} ${currentTheme.hover}`}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy ({selectedItemsForClipboard.length})
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCutSelected}
                            disabled={selectedItemsForClipboard.length === 0}
                            className={`${currentTheme.border} ${currentTheme.hover}`}
                          >
                            <Scissors className="w-4 h-4 mr-2" />
                            Cut ({selectedItemsForClipboard.length})
                          </Button>
                        </>
                      )}

                      {clipboardItems.length > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePaste}
                            disabled={isPasting}
                            className={`${currentTheme.border} ${currentTheme.hover}`}
                          >
                            {isPasting ? (
                              <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Pasting...
                              </>
                            ) : (
                              <>
                                <Clipboard className="w-4 h-4 mr-2" />
                                Paste ({clipboardItems.length})
                              </>
                            )}
                          </Button>

                          {onClearClipboard && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={onClearClipboard}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Clipboard
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {showAddFolderButton && onFolderCreate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewFolderDialog(true)}
                      disabled={Boolean(isFull)}
                      className={`${currentTheme.border} ${currentTheme.hover}`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Folder
                    </Button>
                  )}
                  {showUploadButton && currentFolderId !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      disabled={Boolean(isFull)}
                      className={`${currentTheme.border} ${currentTheme.hover}`}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File(s)
                    </Button>
                  )}
                  {showMultiLevelUploadButton &&
                    currentFolderId !== null &&
                    onMultiLevelFolderCreate &&
                    onMultiLevelFileUpload && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMultiLevelUploadDialog(true)}
                        disabled={Boolean(isFull)}
                        className={`${currentTheme.border} ${currentTheme.hover}`}
                      >
                        <FolderUp className="w-4 h-4 mr-2" />
                        Upload Folder
                      </Button>
                    )}
                  {showUploadButton && currentFolderId !== null && (
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        handleFileSelect(e);
                        // Allow re-selecting the same file across different folders
                        if (e.target) {
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      id="file-upload"
                      className="hidden"
                      disabled={Boolean(isFull)}
                    />
                  )}
                </div>
              </div>
              <StorageBanner
                isAtLeast90={Boolean(isAtLeast90)}
                isFull={Boolean(isFull)}
                showStorageBanner={showStorageBanner}
                percentUsed={percentUsed}
                storageSubjectName={storageSubjectName}
                onDismissStorageBanner={onDismissStorageBanner}
              />
              <Breadcrumbs
                breadcrumbPath={breadcrumbPath}
                onFolderChange={onFolderChange}
                theme={theme}
              />
            </div>
          </CardHeader>
          <CardContent className={`p-0 sm:p-6 ${currentTheme.bg}`}>
            <SelectedFilesSection
              selectedFiles={selectedFiles}
              handleConfirmAll={handleConfirmAll}
              isUploading={isUploading}
              uploadingIds={uploadingIds}
              isBatchUploading={isBatchUploading}
              hasNameConflicts={hasNameConflicts}
              onClearSelectedFiles={onClearSelectedFiles}
              handleFileUpload={handleFileUpload}
              onRemoveSelectedFile={onRemoveSelectedFile}
              onSelectedFileNameChange={onSelectedFileNameChange}
              currentTheme={currentTheme}
            />
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className={`max-h-80 overflow-y-auto ${currentTheme.bg}`}>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 pr-2 ${currentTheme.bg}`}
                >
                  {foldersToRender.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      isSelected={isItemSelected(folder.id)}
                      isInClipboard={isItemInClipboard(folder.id)}
                      clipboardOperation={clipboardOperation}
                      isSelectionMode={isSelectionMode}
                      currentTheme={currentTheme}
                      onToggleItemSelection={onToggleItemSelection}
                      onFolderDoubleClick={handleFolderDoubleClick}
                      onRenameFolder={onRenameFolder}
                      onDeleteFolder={onDeleteFolder}
                      onFolderArchive={onFolderArchive}
                      onFolderUnarchive={onFolderUnarchive}
                      theme={theme}
                      openRenameFolderDialog={openRenameFolderDialog}
                      openDeleteFolderDialog={openDeleteFolderDialog}
                    />
                  ))}
                </div>
                <div className={`space-y-2 pr-2 ${currentTheme.bg}`}>
                  {filesToRender
                    .filter((file) => {
                      // While a selected file is uploading, hide the optimistic temp duplicate in the list
                      const uploadingSelectedNames = selectedFiles
                        .filter((sf) => uploadingIds.includes(sf.id))
                        .map((sf) => sf.name);
                      const isTemp =
                        typeof file.id === "string" &&
                        file.id.startsWith("temp-");
                      if (
                        isTemp &&
                        uploadingSelectedNames.includes(file.name)
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        isSelected={isItemSelected(file.id)}
                        isInClipboard={isItemInClipboard(file.id)}
                        clipboardOperation={clipboardOperation}
                        isSelectionMode={isSelectionMode}
                        currentTheme={currentTheme}
                        onToggleItemSelection={onToggleItemSelection}
                        onRenameFile={onRenameFile}
                        onDeleteFile={onDeleteFile}
                        onFileArchive={onFileArchive}
                        onFileUnarchive={onFileUnarchive}
                        openRenameFileDialog={openRenameFileDialog}
                        openDeleteFileDialog={openDeleteFileDialog}
                      />
                    ))}
                </div>
                {!isLoading &&
                  filesToRender.length === 0 &&
                  foldersToRender.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-gray-500">
                      <Folder
                        className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${currentTheme.folder} opacity-30`}
                      />
                      <p className="text-base sm:text-lg font-medium mb-2">
                        {isSearching
                          ? "No items match your search"
                          : "This folder is empty"}
                      </p>
                      <p className="text-xs sm:text-sm px-4">
                        {isSearching
                          ? "Try adjusting your search query"
                          : "Drag and drop files here or use the upload button"}
                      </p>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Multi-Level Folder Upload Dialog */}
      {onMultiLevelFolderCreate && onMultiLevelFileUpload && (
        <MultiLevelFolderUpload
          open={showMultiLevelUploadDialog}
          onOpenChange={setShowMultiLevelUploadDialog}
          currentFolderId={currentFolderId}
          onFolderCreate={onMultiLevelFolderCreate}
          onFileUpload={onMultiLevelFileUpload}
          onComplete={() => {
            if (onRefresh) {
              onRefresh();
            }
          }}
          theme={theme}
          title="Upload Folder"
        />
      )}
    </>
  );
}
