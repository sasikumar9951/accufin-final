"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  EyeOff,
  Eye,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  LayoutGrid,
  Grid2x2,
  List,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import React, { useMemo, useState, useEffect } from "react";
import FileBrowser from "@/app/_component/FileBrowser";
import { ManagedFile } from "@/types/files";
import { toast } from "react-hot-toast";
import { s3 } from "@/lib/s3";
import { apiFetch } from "@/lib/client-api";
import { v4 as uuidv4 } from "uuid";

type ClipboardItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  parentFolderId: string | null;
};

interface User {
  id: string;
  email: string;
  name?: string;
  uploadedFiles: number;
  uploadedFolders?: number;
  storageUsed?: number;
  maxStorageLimit?: number;
}

interface FileDetail {
  id: string;
  name: string;
  size: string;
  url: string;
  createdAt?: string;
  folderName?: string;
  parentFolderId?: string | null;
  type?: string;
}

interface UserDetails {
  userUploadedFiles?: FileDetail[];
  userPrivateFiles?: FileDetail[];
  userReceivedFiles?: FileDetail[];
  userArchivedFiles?: FileDetail[];
}

interface SelectedFile {
  id: string;
  url: string;
  path: string;
  name: string;
  size: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  file: globalThis.File;
}

type Folder = {
  id: string;
  name: string;
};

// Type aliases for union types
type ClipboardOperation = "copy" | "cut" | null;
type UsersViewMode = "grid" | "gridNoStorage" | "list";

// Shared helpers to reduce duplication
const createSelectedFilesFromList = (list: FileList | null): SelectedFile[] => {
  if (!list || list.length === 0) return [];
  const validFiles: File[] = [];
  for (let i = 0; i < list.length; i++) {
    const file = list.item(i);
    if (file?.name) validFiles.push(file);
  }
  return validFiles.map((file) => ({
    id: uuidv4(),
    url: "",
    path: "",
    name: file.name || "Unnamed File",
    size: `${(file.size / 1024).toFixed(1)} KB`,
    type: file.type || "application/octet-stream",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    file,
  }));
};

const uploadFileToS3AndDB = async (
  params: {
    selectedUser: string;
    fileName: string;
    fileType: string;
    fileObj: File;
    parentFolderId: string;
    isPrivate: boolean;
  }
) => {
  const { selectedUser, fileName, fileType, fileObj, parentFolderId, isPrivate } = params;
  const filePath = s3.getUserSendingFilePath(selectedUser, fileName, parentFolderId);

  const signedUrlRes = await apiFetch("/api/s3/put", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filePath, contentType: fileType }), logoutOn401: false });
  if (!signedUrlRes.ok) throw new Error("Failed to get signed URL");
  const { signedUrl } = await signedUrlRes.json();

  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    body: fileObj,
    headers: { "Content-Type": fileType },
  });
  if (!uploadRes.ok) throw new Error("Failed to upload file to S3");

  const dbRes = await apiFetch("/api/s3/admin-db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filePath, url: signedUrl, name: fileName, size: `${(fileObj.size / 1024).toFixed(1)} KB`, type: fileType, uploadedById: selectedUser, receivedById: selectedUser, isAdminOnlyPrivateFile: isPrivate, parentFolderId }), logoutOn401: false });
  if (!dbRes.ok) throw new Error("Failed to save file in database");
  return await dbRes.json();
};

const processFiles = (
  allFiles: FileDetail[] | undefined,
  currentFolderId: string | null
) => {
  const folders: Folder[] = [];
  const files: FileDetail[] = [];
  if (!allFiles) {
    return { files: [], folders: [] };
  }

  // Get files and folders in current directory
  for (const file of allFiles) {
    if (file.parentFolderId === currentFolderId) {
      if (file.type === "folder") {
        folders.push({ id: file.id, name: file.name || "Unnamed Folder" });
      } else {
        files.push(file);
      }
    }
  }

  const managedFiles: ManagedFile[] = files.map((file) => ({
    id: file.id,
    name: file.name || "Unnamed File",
    url: file.url,
    size: file.size,
    createdAt: file.createdAt,
    folderName: file.folderName,
    parentFolderId: file.parentFolderId,
  }));
  return { files: managedFiles, folders };
};

// Helper function to render user storage info
const renderUserStorageInfo = (user: User, formatReadableSize: (kb: number | undefined) => string) => {
  const used = user.storageUsed || 0;
  const limit = user.maxStorageLimit || 0;
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  
  const getStorageBarColor = () => {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 90) return "bg-amber-500";
    return "bg-emerald-500";
  };
  
  return (
    <div className="mt-1">
      <div className="h-1.5 w-full bg-gray-200 rounded">
        <div
          className={`${getStorageBarColor()} h-1.5 rounded`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-gray-600">
        {limit > 0
          ? `${formatReadableSize(used)} / ${formatReadableSize(limit)} (${percent}%)`
          : `${formatReadableSize(used)} used`}
      </div>
    </div>
  );
};

// Helper function to render user content based on view mode
const renderUserContent = (user: User, usersViewMode: UsersViewMode, formatReadableSize: (kb: number | undefined) => string) => {
  if (usersViewMode === "grid") {
    return (
      <>
        <p className="text-xs font-medium text-gray-900 truncate">
          {user.name || user.email}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user.name && user.email === user.name ? "" : user.email}
        </p>
        {renderUserStorageInfo(user, formatReadableSize)}
      </>
    );
  }
  
  if (usersViewMode === "gridNoStorage") {
    return (
      <>
        <p className="text-xs font-medium text-gray-900 truncate">
          {user.name || user.email}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user.name && user.email === user.name ? "" : user.email}
        </p>
      </>
    );
  }
  
  const primary = user.name || user.email;
  const showSecondary = user.name && user.email !== user.name;
  return (
    <p className="text-sm text-gray-900 truncate">
      <span className="font-medium">{primary}</span>
      {showSecondary && (
        <span className="text-gray-500">{` - ${user.email}`}</span>
      )}
    </p>
  );
};

export default function FileManagement() {
  const formatReadableSize = (kb: number | undefined): string => {
    const v = typeof kb === "number" ? kb : 0;
    if (v >= 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(2)} GB`;
    if (v >= 1024) return `${(v / 1024).toFixed(2)} MB`;
    return `${v} KB`;
  };
  // Internal state management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedFilesFolderId, setUploadedFilesFolderId] = useState<
    string | null
  >(null);
  const [archivedFilesFolderId, setArchivedFilesFolderId] = useState<
    string | null
  >(null);
  const [privateFilesFolderId, setPrivateFilesFolderId] = useState<
    string | null
  >(null);
  const [responseFilesFolderId, setResponseFilesFolderId] = useState<
    string | null
  >(null);
  const [isUsersCollapsed, setIsUsersCollapsed] = useState(false);
  const [isFilesFromUserCollapsed, setIsFilesFromUserCollapsed] =
    useState(false);
  const [isDocumentManagementCollapsed, setIsDocumentManagementCollapsed] =
    useState(false);
  const [uploadedBreadcrumbPath, setUploadedBreadcrumbPath] = useState<
    { id: string; name: string }[]
  >([]);
  const [archivedBreadcrumbPath, setArchivedBreadcrumbPath] = useState<
    { id: string; name: string }[]
  >([]);
  const [privateBreadcrumbPath, setPrivateBreadcrumbPath] = useState<
    { id: string; name: string }[]
  >([]);
  const [responseBreadcrumbPath, setResponseBreadcrumbPath] = useState<
    { id: string; name: string }[]
  >([]);

  // Local optimistic state for Document Management lists
  const [privateFilesData, setPrivateFilesData] = useState<
    FileDetail[] | undefined
  >(undefined);
  const [responseFilesData, setResponseFilesData] = useState<
    FileDetail[] | undefined
  >(undefined);

  // Multiple file upload state
  const [privateSelectedFiles, setPrivateSelectedFiles] = useState<
    SelectedFile[]
  >([]);
  const [responseSelectedFiles, setResponseSelectedFiles] = useState<
    SelectedFile[]
  >([]);
  const [privateUploadingIds, setPrivateUploadingIds] = useState<string[]>([]);
  const [responseUploadingIds, setResponseUploadingIds] = useState<string[]>(
    []
  );
  const [isPrivateBatchUploading, setIsPrivateBatchUploading] = useState(false);
  const [isResponseBatchUploading, setIsResponseBatchUploading] =
    useState(false);

  // Pagination state for users list
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [usersViewMode, setUsersViewMode] = useState<UsersViewMode>("grid");

  // Fetch users data
  const fetchUsers = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/get-users", { logoutOn401: false });
      if (res.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch users");
      const usersData = await res.json();
      setUsers(usersData);
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUserFileData = async (userId: string) => {
    setUserDetailsLoading(true);
    setUserDetailsError(null);
    setUserDetails(null);

    try {
      const res = await apiFetch(`/api/admin/user-details/${userId}`, { logoutOn401: false });
      if (!res.ok) throw new Error("Failed to fetch user details");
      const data = await res.json();
      setUserDetails(data);
    } catch (err) {
      setUserDetailsError(
        typeof err === "string" ? err : "Failed to load user details"
      );
    } finally {
      setUserDetailsLoading(false);
    }
  };

  // Extracted pagination handlers to reduce nesting depth
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = (totalPages: number) => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Create bound handlers to avoid nesting
  const createUserClickHandler = (userId: string) => () => handleUserSelect(userId);
  const createPageSelectHandler = (pageNum: number) => () => setCurrentPage(pageNum);

  // Fetch user details when selectedUser changes
  useEffect(() => {
    if (!selectedUser) {
      setUserDetails(null);
      setUserDetailsError(null);
      return;
    }

    fetchUserFileData(selectedUser);
  }, [selectedUser]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handler functions
  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefreshUserDetails = () => {
    if (selectedUser) {
      fetchUserFileData(selectedUser);
    }
  };

  const reloadUsers = async () => {
    try {
      const res = await apiFetch("/api/admin/get-users", { logoutOn401: false });
      if (res.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch users");
      const usersData = await res.json();
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to reload users:", error);
      toast.error("Failed to reload users");
    }
  };

  // Clipboard state for each tab
  const [uploadedClipboard, setUploadedClipboard] = useState<{
    items: ClipboardItem[];
    operation: ClipboardOperation;
    selectedItems: string[];
  }>({ items: [], operation: null, selectedItems: [] });

  const [archivedClipboard, setArchivedClipboard] = useState<{
    items: ClipboardItem[];
    operation: ClipboardOperation;
    selectedItems: string[];
  }>({ items: [], operation: null, selectedItems: [] });

  const [privateClipboard, setPrivateClipboard] = useState<{
    items: ClipboardItem[];
    operation: ClipboardOperation;
    selectedItems: string[];
  }>({ items: [], operation: null, selectedItems: [] });

  const [responseClipboard, setResponseClipboard] = useState<{
    items: ClipboardItem[];
    operation: ClipboardOperation;
    selectedItems: string[];
  }>({ items: [], operation: null, selectedItems: [] });

  // Pasting state for each tab
  const [isPastingUploaded, setIsPastingUploaded] = useState(false);
  const [isPastingArchived, setIsPastingArchived] = useState(false);
  const [isPastingPrivate, setIsPastingPrivate] = useState(false);
  const [isPastingResponse, setIsPastingResponse] = useState(false);

  // Helper function to build breadcrumb path
  const buildBreadcrumbPath = (
    targetFolderId: string | null,
    allFiles: FileDetail[]
  ): { id: string; name: string }[] => {
    if (!targetFolderId) return [];

    const path: { id: string; name: string }[] = [];
    let currentId: string | null = targetFolderId;

    while (currentId) {
      const folder = allFiles.find(
        (f) => f.id === currentId && f.type === "folder"
      );
      if (!folder) break;

      path.unshift({ id: folder.id, name: folder.name || "Unnamed Folder" });
      currentId = folder.parentFolderId || null;
    }

    return path;
  };

  // Folder change handlers
  const handleUploadedFolderChange = (folderId: string | null) => {
    setUploadedFilesFolderId(folderId);
    if (userDetails?.userUploadedFiles) {
      setUploadedBreadcrumbPath(
        buildBreadcrumbPath(folderId, userDetails.userUploadedFiles)
      );
    }
  };

  const handleArchivedFolderChange = (folderId: string | null) => {
    setArchivedFilesFolderId(folderId);
    if (userDetails?.userArchivedFiles) {
      setArchivedBreadcrumbPath(
        buildBreadcrumbPath(folderId, userDetails.userArchivedFiles)
      );
    }
  };

  const handlePrivateFolderChange = (folderId: string | null) => {
    setPrivateFilesFolderId(folderId);
    if (privateFilesData) {
      setPrivateBreadcrumbPath(buildBreadcrumbPath(folderId, privateFilesData));
    }
  };

  const handleResponseFolderChange = (folderId: string | null) => {
    setResponseFilesFolderId(folderId);
    if (responseFilesData) {
      setResponseBreadcrumbPath(
        buildBreadcrumbPath(folderId, responseFilesData)
      );
    }
  };

  // Sync local state with userDetails for optimistic updates
  useEffect(() => {
    if (userDetails) {
      setPrivateFilesData(userDetails.userPrivateFiles);
      setResponseFilesData(userDetails.userReceivedFiles);
    }
  }, [userDetails]);

  // Reset state when selected user changes to ensure UI returns to root
  useEffect(() => {
    // Reset folder navigation
    setUploadedFilesFolderId(null);
    setArchivedFilesFolderId(null);
    setPrivateFilesFolderId(null);
    setResponseFilesFolderId(null);

    // Reset breadcrumbs
    setUploadedBreadcrumbPath([]);
    setArchivedBreadcrumbPath([]);
    setPrivateBreadcrumbPath([]);
    setResponseBreadcrumbPath([]);

    // Clear data and selections
    setPrivateFilesData(undefined);
    setResponseFilesData(undefined);
    setPrivateSelectedFiles([]);
    setResponseSelectedFiles([]);

    // Clear uploading state
    setPrivateUploadingIds([]);
    setResponseUploadingIds([]);
    setIsPrivateBatchUploading(false);
    setIsResponseBatchUploading(false);

    // Clear clipboards and pasting states
    setUploadedClipboard({ items: [], operation: null, selectedItems: [] });
    setArchivedClipboard({ items: [], operation: null, selectedItems: [] });
    setPrivateClipboard({ items: [], operation: null, selectedItems: [] });
    setResponseClipboard({ items: [], operation: null, selectedItems: [] });
    setIsPastingUploaded(false);
    setIsPastingArchived(false);
    setIsPastingPrivate(false);
    setIsPastingResponse(false);
  }, [selectedUser]);

  // Multiple file selection handlers
  const handlePrivateFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newItems = createSelectedFilesFromList(e.target.files);
    if (newItems.length === 0) return;
    setPrivateSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const handleResponseFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newItems = createSelectedFilesFromList(e.target.files);
    if (newItems.length === 0) return;
    setResponseSelectedFiles((prev) => [...prev, ...newItems]);
  };

  // File removal handlers
  const handleRemovePrivateSelectedFile = (selectedTempId: string) => {
    setPrivateSelectedFiles((prev) =>
      prev.filter((f) => f.id !== selectedTempId)
    );
  };

  const handleRemoveResponseSelectedFile = (selectedTempId: string) => {
    setResponseSelectedFiles((prev) =>
      prev.filter((f) => f.id !== selectedTempId)
    );
  };

  // Clear all selected files
  const handleClearPrivateSelectedFiles = () => {
    setPrivateSelectedFiles([]);
  };

  const handleClearResponseSelectedFiles = () => {
    setResponseSelectedFiles([]);
  };

  // File name change handlers
  const handlePrivateSelectedFileNameChange = (
    selectedTempId: string,
    newName: string
  ) => {
    setPrivateSelectedFiles((prev) =>
      prev.map((f) => (f.id === selectedTempId ? { ...f, name: newName } : f))
    );
  };

  const handleResponseSelectedFileNameChange = (
    selectedTempId: string,
    newName: string
  ) => {
    setResponseSelectedFiles((prev) =>
      prev.map((f) => (f.id === selectedTempId ? { ...f, name: newName } : f))
    );
  };

  const { files: processedUploadedFiles, folders: processedUploadedFolders } =
    useMemo(
      () => processFiles(userDetails?.userUploadedFiles, uploadedFilesFolderId),
      [userDetails?.userUploadedFiles, uploadedFilesFolderId]
    );

  const { files: processedArchivedFiles, folders: processedArchivedFolders } =
    useMemo(
      () => processFiles(userDetails?.userArchivedFiles, archivedFilesFolderId),
      [userDetails?.userArchivedFiles, archivedFilesFolderId]
    );

  const { files: processedPrivateFiles, folders: processedPrivateFolders } =
    useMemo(
      () => processFiles(privateFilesData, privateFilesFolderId),
      [privateFilesData, privateFilesFolderId]
    );

  const { files: processedResponseFiles, folders: processedResponseFolders } =
    useMemo(
      () => processFiles(responseFilesData, responseFilesFolderId),
      [responseFilesData, responseFilesFolderId]
    );

  const handleAdminFolderCreate = async (
    folderName: string,
    type: "private" | "response"
  ) => {
    if (!selectedUser) return;
    const parentFolderId =
      type === "private" ? privateFilesFolderId : responseFilesFolderId;

    try {
      // Prevent duplicate folder names by appending a random number if needed
      const list =
        type === "private" ? privateFilesData || [] : responseFilesData || [];
      const siblingNames = new Set(
        list
          .filter(
            (f) => f.parentFolderId === parentFolderId && f.type === "folder"
          )
          .map((f) => (f.name || "").toLowerCase())
      );
      let finalName = folderName.trim();
      if (siblingNames.has(finalName.toLowerCase())) {
        for (let i = 1; i < 1000; i++) {
          const candidate = `${finalName} (${i})`;
          if (!siblingNames.has(candidate.toLowerCase())) {
            finalName = candidate;
            break;
          }
        }
      }

      const res = await apiFetch("/api/s3/admin-db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFolderCreation: true, folderName: finalName, parentFolderId, userId: selectedUser, isAdminOnlyPrivateFile: type === "private" }), logoutOn401: false });

      if (!res.ok) throw new Error("Failed to create folder");

      const created = await res.json();

      // Add the created folder to the appropriate data state
      if (type === "private") {
        setPrivateFilesData((prev) => [...(prev || []), created]);
      } else {
        setResponseFilesData((prev) => [...(prev || []), created]);
      }

      toast.success("Folder created successfully");
      // Refresh data to ensure consistency
      reloadUsers();
    } catch (err) {
      console.error('Failed to create folder:', err);
      const message = err instanceof Error ? err.message : 'Failed to create folder';
      toast.error(message);
    }
  };

  // Multiple file upload handlers
  const uploadPrivateFile = async (sf: SelectedFile) => {
    if (!selectedUser) return false;
    if (privateFilesFolderId === null) {
      toast.error("Please select or create a folder before uploading a file.");
      return false;
    }
    try {
      setPrivateUploadingIds((prev) => [...prev, sf.id]);
      const newFile = await uploadFileToS3AndDB({
        selectedUser,
        fileName: sf.name,
        fileType: sf.type,
        fileObj: sf.file,
        parentFolderId: privateFilesFolderId,
        isPrivate: true,
      });

      // Add the new file to the data state
      setPrivateFilesData((prev) => [newFile, ...(prev || [])]);

      toast.success(`${sf.name} uploaded successfully!`);
      return true;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
      return false;
    } finally {
      setPrivateUploadingIds((prev) => prev.filter((id) => id !== sf.id));
    }
  };

  const uploadResponseFile = async (sf: SelectedFile) => {
    if (!selectedUser) return false;
    if (responseFilesFolderId === null) {
      toast.error("Please select or create a folder before uploading a file.");
      return false;
    }
    try {
      setResponseUploadingIds((prev) => [...prev, sf.id]);
      const newFile = await uploadFileToS3AndDB({
        selectedUser,
        fileName: sf.name,
        fileType: sf.type,
        fileObj: sf.file,
        parentFolderId: responseFilesFolderId,
        isPrivate: false,
      });

      // Add the new file to the data state
      setResponseFilesData((prev) => [newFile, ...(prev || [])]);

      toast.success(`${sf.name} uploaded successfully!`);
      return true;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
      return false;
    } finally {
      setResponseUploadingIds((prev) => prev.filter((id) => id !== sf.id));
    }
  };

  // Upload individual files
  const handlePrivateFileUploadById = async (selectedTempId: string) => {
    const sf = privateSelectedFiles.find((f) => f.id === selectedTempId);
    if (!sf) return;

    const ok = await uploadPrivateFile(sf);
    if (ok) {
      setPrivateSelectedFiles((prev) =>
        prev.filter((f) => f.id !== selectedTempId)
      );
    }
  };

  const handleResponseFileUploadById = async (selectedTempId: string) => {
    const sf = responseSelectedFiles.find((f) => f.id === selectedTempId);
    if (!sf) return;

    const ok = await uploadResponseFile(sf);
    if (ok) {
      setResponseSelectedFiles((prev) =>
        prev.filter((f) => f.id !== selectedTempId)
      );
    }
  };

  // Upload all files
  const handlePrivateConfirmAll = async () => {
    if (privateSelectedFiles.length === 0) return;
    setIsPrivateBatchUploading(true);
    const successfullyUploaded: string[] = [];
    const currentPrivateFiles = [...processedPrivateFiles]; // Create a copy to track newly uploaded files

    try {
      for (const sf of privateSelectedFiles) {
        // Skip if duplicate name exists in current view or in files we've already processed
        const duplicate = currentPrivateFiles.some((f) => f.name === sf.name);
        if (duplicate) {
          successfullyUploaded.push(sf.id); // Mark as "processed" even if skipped
          continue;
        }

        const success = await uploadPrivateFile(sf);
        if (success) {
          successfullyUploaded.push(sf.id);
          // Add the newly uploaded file to our tracking array to prevent duplicates in the same batch
          currentPrivateFiles.push({
            id: sf.id,
            name: sf.name,
          } as any);
        }
      }

      // Remove successfully uploaded files from selected files list
      setPrivateSelectedFiles((prev) =>
        prev.filter((f) => !successfullyUploaded.includes(f.id))
      );
      toast.success("All files uploaded successfully.");
    } finally {
      setIsPrivateBatchUploading(false);
    }
  };

  const handleResponseConfirmAll = async () => {
    if (responseSelectedFiles.length === 0) return;
    setIsResponseBatchUploading(true);
    const successfullyUploaded: string[] = [];
    const currentResponseFiles = [...processedResponseFiles]; // Create a copy to track newly uploaded files

    try {
      for (const sf of responseSelectedFiles) {
        // Skip if duplicate name exists in current view or in files we've already processed
        const duplicate = currentResponseFiles.some((f) => f.name === sf.name);
        if (duplicate) {
          successfullyUploaded.push(sf.id); // Mark as "processed" even if skipped
          continue;
        }

        const success = await uploadResponseFile(sf);
        if (success) {
          successfullyUploaded.push(sf.id);
          // Add the newly uploaded file to our tracking array to prevent duplicates in the same batch
          currentResponseFiles.push({
            id: sf.id,
            name: sf.name,
          } as any);
        }
      }

      // Remove successfully uploaded files from selected files list
      setResponseSelectedFiles((prev) =>
        prev.filter((f) => !successfullyUploaded.includes(f.id))
      );
      toast.success("All files uploaded successfully.");
    } finally {
      setIsResponseBatchUploading(false);
    }
  };

  const handleArchiveFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/admin/files/${fileId}/archive`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to archive file");
      toast.success("File archived successfully");
      handleRefreshUserDetails();
    } catch (err) {
      console.error('Failed to archive file:', err);
      const message = err instanceof Error ? err.message : 'Failed to archive file';
      toast.error(message);
    }
  };

  const handleArchiveFolder = async (folderId: string) => {
    try {
      const res = await fetch(`/api/admin/folders/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          selectedUserId: selectedUser,
        }),
      });
      if (!res.ok) throw new Error("Failed to archive folder");
      const result = await res.json();
      toast.success(
        `Folder archived successfully (${result.archivedCount} items moved)`
      );
      handleRefreshUserDetails();
    } catch (err) {
      console.error('Failed to archive folder:', err);
      const message = err instanceof Error ? err.message : 'Failed to archive folder';
      toast.error(message);
    }
  };
  const handleUnarchiveFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/admin/files/${fileId}/unarchive`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to unarchive file");
      toast.success("File unarchived successfully");
      handleRefreshUserDetails();
    } catch (err) {
      console.error('Failed to unarchive file:', err);
      const message = err instanceof Error ? err.message : 'Failed to unarchive file';
      toast.error(message);
    }
  };

  const handleUnarchiveFolder = async (folderId: string) => {
    try {
      const res = await fetch(`/api/admin/folders/unarchive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          selectedUserId: selectedUser,
        }),
      });
      if (!res.ok) throw new Error("Failed to unarchive folder");
      const result = await res.json();
      toast.success(
        `Folder unarchived successfully (${result.unarchivedCount} items moved)`
      );
      handleRefreshUserDetails();
    } catch (err) {
      console.error('Failed to unarchive folder:', err);
      const message = err instanceof Error ? err.message : 'Failed to unarchive folder';
      toast.error(message);
    }
  };

  // Admin rename/delete for Document Management (private/response)
  const handlePrivateRenameFile = async (fileId: string, newName: string) => {
    const prev = privateFilesData;
    setPrivateFilesData((curr) =>
      (curr || []).map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
    try {
      const res = await fetch(`/api/user/files/${fileId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName }),
      });
      if (!res.ok) throw new Error("Failed to rename file");
      toast.success("File renamed successfully");
      // UI already updated optimistically
    } catch (e) {
      console.error('Failed to rename file:', e);
      setPrivateFilesData(prev);
      const message = e instanceof Error ? e.message : 'Failed to rename file';
      toast.error(message);
    }
  };

  const handleResponseRenameFile = async (fileId: string, newName: string) => {
    const prev = responseFilesData;
    setResponseFilesData((curr) =>
      (curr || []).map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
    try {
      const res = await fetch(`/api/user/files/${fileId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName }),
      });
      if (!res.ok) throw new Error("Failed to rename file");
      toast.success("File renamed successfully");
      // UI already updated optimistically
    } catch (e) {
      console.error('Failed to rename file:', e);
      setResponseFilesData(prev);
      const message = e instanceof Error ? e.message : 'Failed to rename file';
      toast.error(message);
    }
  };

  const handlePrivateRenameFolder = async (
    folderId: string,
    newName: string
  ) => {
    const prev = privateFilesData;
    setPrivateFilesData((curr) =>
      (curr || []).map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
    try {
      const res = await fetch(`/api/admin/folders/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          newName,
          selectedUserId: selectedUser,
          isPrivate: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to rename folder");
      toast.success("Folder renamed successfully");
    } catch (e) {
      console.error('Failed to rename folder:', e);
      setPrivateFilesData(prev);
      const message = e instanceof Error ? e.message : 'Failed to rename folder';
      toast.error(message);
    }
  };

  const handleResponseRenameFolder = async (
    folderId: string,
    newName: string
  ) => {
    const prev = responseFilesData;
    setResponseFilesData((curr) =>
      (curr || []).map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
    try {
      const res = await fetch(`/api/admin/folders/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          newName,
          selectedUserId: selectedUser,
          isPrivate: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to rename folder");
      toast.success("Folder renamed successfully");
    } catch (e) {
      console.error('Failed to rename folder:', e);
      setResponseFilesData(prev);
      const message = e instanceof Error ? e.message : 'Failed to rename folder';
      toast.error(message);
    }
  };

  const handlePrivateDeleteFile = async (fileId: string) => {
    const prev = privateFilesData;
    setPrivateFilesData((curr) => (curr || []).filter((f) => f.id !== fileId));
    try {
      const res = await fetch(`/api/user/files/${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete file");
      toast.success("File deleted successfully");
      // UI already updated optimistically
    } catch (e) {
      console.error('Failed to delete file:', e);
      setPrivateFilesData(prev);
      const message = e instanceof Error ? e.message : 'Failed to delete file';
      toast.error(message);
    }
  };

  const handleResponseDeleteFile = async (fileId: string) => {
    const prev = responseFilesData;
    setResponseFilesData((curr) => (curr || []).filter((f) => f.id !== fileId));
    try {
      const res = await fetch(`/api/user/files/${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete file");
      toast.success("File deleted successfully");
      // UI already updated optimistically
    } catch (e) {
      console.error('Failed to delete file:', e);
      setResponseFilesData(prev);
      const message = e instanceof Error ? e.message : 'Failed to delete file';
      toast.error(message);
    }
  };

  const handlePrivateDeleteFolder = async (folderId: string) => {
    const prev = privateFilesData;
    const getAllDescendants = (parentId: string): string[] => {
      const children = (privateFilesData || []).filter(
        (f) => f.parentFolderId === parentId
      );
      let allIds: string[] = [parentId];
      for (const child of children) {
        if (child.type === "folder") {
          allIds = allIds.concat(getAllDescendants(child.id));
        } else {
          allIds.push(child.id);
        }
      }
      return allIds;
    };
    const allIds = getAllDescendants(folderId);
    setPrivateFilesData((curr) =>
      (curr || []).filter((f) => !allIds.includes(f.id))
    );
    try {
      const res = await fetch(`/api/admin/folders/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          selectedUserId: selectedUser,
          isPrivate: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to delete folder");
      toast.success("Folder deleted successfully");
    } catch (e) {
      console.error('Failed to delete folder:', e);
      setPrivateFilesData(prev);
      const message = e instanceof Error ? e.message : 'Failed to delete folder';
      toast.error(message);
    }
  };

  const handleResponseDeleteFolder = async (folderId: string) => {
    const prev = responseFilesData;
    const getAllDescendants = (parentId: string): string[] => {
      const children = (responseFilesData || []).filter(
        (f) => f.parentFolderId === parentId
      );
      let allIds: string[] = [parentId];
      for (const child of children) {
        if (child.type === "folder") {
          allIds = allIds.concat(getAllDescendants(child.id));
        } else {
          allIds.push(child.id);
        }
      }
      return allIds;
    };
    const allIds = getAllDescendants(folderId);
    setResponseFilesData((curr) =>
      (curr || []).filter((f) => !allIds.includes(f.id))
    );
    try {
      const res = await fetch(`/api/admin/folders/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          selectedUserId: selectedUser,
          isPrivate: false,
        }),
      });
      if (!res.ok) throw new Error("Failed to delete folder");
      toast.success("Folder deleted successfully");
    } catch (e) {
      console.error('Failed to delete folder:', e);
      setResponseFilesData(prev);
      const message = e instanceof Error ? e.message : 'Failed to delete folder';
      toast.error(message);
    }
  };

  // Clipboard handlers for different tabs
  const createClipboardHandlers = (
    tabType: "uploaded" | "archived" | "private" | "response"
  ) => {
    const getIsPasting = () => {
      switch (tabType) {
        case "uploaded":
          return isPastingUploaded;
        case "archived":
          return isPastingArchived;
        case "private":
          return isPastingPrivate;
        case "response":
          return isPastingResponse;
        default:
          return false;
      }
    };

    const setIsPasting = (value: boolean) => {
      switch (tabType) {
        case "uploaded":
          setIsPastingUploaded(value);
          break;
        case "archived":
          setIsPastingArchived(value);
          break;
        case "private":
          setIsPastingPrivate(value);
          break;
        case "response":
          setIsPastingResponse(value);
          break;
      }
    };
    const getClipboard = () => {
      switch (tabType) {
        case "uploaded":
          return uploadedClipboard;
        case "archived":
          return archivedClipboard;
        case "private":
          return privateClipboard;
        case "response":
          return responseClipboard;
        default:
          return { items: [], operation: null, selectedItems: [] };
      }
    };

    const setClipboard = (newState: {
      items: ClipboardItem[];
      operation: "copy" | "cut" | null;
      selectedItems: string[];
    }) => {
      switch (tabType) {
        case "uploaded":
          setUploadedClipboard(newState);
          break;
        case "archived":
          setArchivedClipboard(newState);
          break;
        case "private":
          setPrivateClipboard(newState);
          break;
        case "response":
          setResponseClipboard(newState);
          break;
      }
    };

    const handleCopyItems = (items: ClipboardItem[]) => {
      setClipboard({
        items,
        operation: "copy",
        selectedItems: [],
      });
      toast.success(`${items.length} item(s) copied to clipboard`);
    };

    const handleCutItems = (items: ClipboardItem[]) => {
      setClipboard({
        items,
        operation: "cut",
        selectedItems: [],
      });
      toast.success(`${items.length} item(s) cut to clipboard`);
    };

    const handlePasteItems = async (targetFolderId: string | null) => {
      const clipboard = getClipboard();
      if (!clipboard.items.length || !clipboard.operation || !selectedUser)
        return;

      setIsPasting(true);
      try {
        const itemsToMove = clipboard.items.map((item) => ({
          id: item.id,
          type: item.type,
        }));

        if (clipboard.operation === "cut") {
          let endpoint = "/api/admin/files/bulk-move";
          let payload: any = {
            items: itemsToMove,
            targetFolderId,
            userId: selectedUser,
            isPrivate: tabType === "private",
          };

          // For user uploaded/archived sections, operate on uploadedById context
          if (tabType === "uploaded" || tabType === "archived") {
            endpoint = "/api/admin/files/user-uploaded/bulk-move";
            delete payload.isPrivate;
          }

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to move items");
          }

          // Clear clipboard after successful cut
          setClipboard({ items: [], operation: null, selectedItems: [] });
          toast.success("Items moved successfully");
        } else if (clipboard.operation === "copy") {
          let endpoint = "/api/admin/files/bulk-copy";
          let payload: any = {
            items: itemsToMove,
            targetFolderId,
            userId: selectedUser,
            isPrivate: tabType === "private",
          };

          if (tabType === "uploaded" || tabType === "archived") {
            endpoint = "/api/admin/files/user-uploaded/bulk-copy";
            delete payload.isPrivate;
          }

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to copy items");
          }

          // Don't clear clipboard after copy - allow multiple pastes
          toast.success("Items copied successfully");
        }

        // Refresh data
        handleRefreshUserDetails();
      } catch (error: any) {
        console.error("Error pasting items:", error);
        toast.error(error.message || "Failed to paste items");
      } finally {
        setIsPasting(false);
      }
    };

    const handleClearClipboard = () => {
      setClipboard({ items: [], operation: null, selectedItems: [] });
    };

    const handleToggleItemSelection = (
      itemId: string
    ) => {
      const clipboard = getClipboard();
      const newSelectedItems = clipboard.selectedItems.includes(itemId)
        ? clipboard.selectedItems.filter((id) => id !== itemId)
        : [...clipboard.selectedItems, itemId];

      setClipboard({
        ...clipboard,
        selectedItems: newSelectedItems,
      });
    };

    const handleSelectAllItems = () => {
      const clipboard = getClipboard();
      let allItemIds: string[] = [];

      // Get all item IDs based on tab type
      switch (tabType) {
        case "uploaded":
          allItemIds = [
            ...processedUploadedFiles.map((f) => f.id),
            ...processedUploadedFolders.map((f) => f.id),
          ];
          break;
        case "archived":
          allItemIds = [
            ...processedArchivedFiles.map((f) => f.id),
            ...processedArchivedFolders.map((f) => f.id),
          ];
          break;
        case "private":
          allItemIds = [
            ...processedPrivateFiles.map((f) => f.id),
            ...processedPrivateFolders.map((f) => f.id),
          ];
          break;
        case "response":
          allItemIds = [
            ...processedResponseFiles.map((f) => f.id),
            ...processedResponseFolders.map((f) => f.id),
          ];
          break;
      }

      setClipboard({
        ...clipboard,
        selectedItems: allItemIds,
      });
    };

    const handleClearSelection = () => {
      const clipboard = getClipboard();
      setClipboard({
        ...clipboard,
        selectedItems: [],
      });
    };

    return {
      clipboard: getClipboard(),
      handleCopyItems,
      handleCutItems,
      handlePasteItems,
      handleClearClipboard,
      handleToggleItemSelection,
      handleSelectAllItems,
      handleClearSelection,
      isPasting: getIsPasting(),
    };
  };

  // Multi-level folder upload handlers for admin
  const handleAdminMultiLevelFolderCreate = async (
    name: string,
    parentId: string | null,
    type: "private" | "response"
  ): Promise<{ id: string }> => {
    if (!selectedUser) {
      throw new Error("No user selected");
    }

    try {
      // Prevent duplicate folder names by appending a random number if needed
      const list =
        type === "private" ? privateFilesData || [] : responseFilesData || [];
      const siblingNames = new Set(
        list
          .filter((f) => f.parentFolderId === parentId && f.type === "folder")
          .map((f) => (f.name || "").toLowerCase())
      );
      let finalName = name.trim();
      if (siblingNames.has(finalName.toLowerCase())) {
        for (let i = 1; i < 1000; i++) {
          const candidate = `${finalName} (${i})`;
          if (!siblingNames.has(candidate.toLowerCase())) {
            finalName = candidate;
            break;
          }
        }
      }

      const res = await apiFetch("/api/s3/admin-db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFolderCreation: true, folderName: finalName, parentFolderId: parentId, userId: selectedUser, isAdminOnlyPrivateFile: type === "private" }), logoutOn401: false });

      if (!res.ok) {
        throw new Error("Failed to create folder");
      }

      const created = await res.json();
      console.log(`Created admin folder: ${finalName} with ID: ${created.id}`);
      return { id: created.id };
    } catch (error) {
      console.error("Error creating admin folder:", error);
      throw error;
    }
  };

  const handleAdminMultiLevelFileUpload = async (
    file: File,
    name: string,
    parentId: string,
    type: "private" | "response"
  ): Promise<boolean> => {
    if (!selectedUser) {
      throw new Error("No user selected");
    }

    try {
      const filePath = s3.getUserSendingFilePath(selectedUser, name, parentId);

      // Get signed URL
      const signedUrlRes = await apiFetch("/api/s3/put", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filePath, contentType: file.type }), logoutOn401: false });

      if (!signedUrlRes.ok) {
        throw new Error("Failed to get signed URL");
      }

      const { signedUrl } = await signedUrlRes.json();

      // Upload file to S3
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to S3");
      }

      // Save file info to database
      const dbRes = await apiFetch("/api/s3/admin-db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filePath, url: signedUrl, name, size: `${(file.size / 1024).toFixed(1)} KB`, type: file.type, uploadedById: selectedUser, receivedById: selectedUser, isAdminOnlyPrivateFile: type === "private", parentFolderId: parentId }), logoutOn401: false });

      if (!dbRes.ok) {
        throw new Error("Failed to save file in database");
      }

      console.log(`Uploaded admin file: ${name}`);
      return true;
    } catch (error) {
      console.error("Error uploading admin file:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle>User Management</CardTitle>
              {!isUsersCollapsed && (
                <CardDescription>
                  Select a user to manage their documents
                </CardDescription>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0 sm:ml-auto flex-nowrap w-full sm:w-auto justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
                className="h-8 w-8 p-0 justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Refresh users"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant={usersViewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setUsersViewMode("grid")}
                className="h-8 w-8 p-0 justify-center"
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={usersViewMode === "gridNoStorage" ? "default" : "ghost"}
                size="sm"
                onClick={() => setUsersViewMode("gridNoStorage")}
                className="h-8 w-8 p-0 justify-center"
                title="Grid view (no storage)"
              >
                <Grid2x2 className="h-4 w-4" />
                <span className="sr-only">No storage</span>
              </Button>
              <Button
                variant={usersViewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setUsersViewMode("list")}
                className="h-8 w-8 p-0 justify-center"
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUsersCollapsed(!isUsersCollapsed)}
                className="h-8 w-8 p-0"
              >
                {isUsersCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {isUsersCollapsed && selectedUser && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-3 h-3 text-blue-600" />
              </div>
              <span>
                {(() => {
                  const selectedUserData = users.find(
                    (u) => u.id === selectedUser
                  );
                  return (
                    selectedUserData?.name ||
                    selectedUserData?.email ||
                    "Selected user"
                  );
                })()}
              </span>
            </div>
          )}
        </CardHeader>
        {!isUsersCollapsed && (
          <CardContent>
            {(() => {
              if (loading) {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Loader size={48} className="mb-2 text-blue-500" />
                    Loading users...
                  </div>
                );
              }
              
              if (error) {
                return <div className="text-center py-8 text-red-500">{error}</div>;
              }
              
              return (
                <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="w-full max-w-md p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <div className="max-h-80 overflow-y-auto">
                  <div className={`${usersViewMode === "list" ? "flex flex-col" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"} gap-2 pr-2`}>
                    {(() => {
                      const filteredUsers = users.filter((user) => {
                        const searchTerm = searchQuery.toLowerCase();
                        const emailMatch = user.email
                          .toLowerCase()
                          .includes(searchTerm);
                        const nameMatch =
                          user.name?.toLowerCase().includes(searchTerm) ||
                          false;
                        return emailMatch || nameMatch;
                      });
                      const startIndex = (currentPage - 1) * usersPerPage;
                      const paginatedUsers = filteredUsers.slice(
                        startIndex,
                        startIndex + usersPerPage
                      );

                      return paginatedUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={createUserClickHandler(user.id)}
                          className={`p-2 rounded-md cursor-pointer transition-all duration-200 w-full text-left ${
                            selectedUser === user.id
                              ? "bg-blue-50 border-2 border-blue-300 shadow-sm"
                              : "bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <div className={`${usersViewMode === "list" ? "flex items-center space-x-3" : "flex items-center space-x-2"}`}>
                            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-2 h-2 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {renderUserContent(user, usersViewMode, formatReadableSize)}
                            </div>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                {/* Pagination Controls */}
                {(() => {
                  const filteredUsers = users.filter((user) => {
                    const searchTerm = searchQuery.toLowerCase();
                    const emailMatch = user.email
                      .toLowerCase()
                      .includes(searchTerm);
                    const nameMatch =
                      user.name?.toLowerCase().includes(searchTerm) || false;
                    return emailMatch || nameMatch;
                  });
                  const totalPages = Math.ceil(
                    filteredUsers.length / usersPerPage
                  );

                  if (totalPages <= 1) return null;

                  return (
                    <div className="flex items-center justify-between mt-4 px-2">
                      <div className="text-sm text-gray-600">
                        Showing{" "}
                        {Math.min(
                          (currentPage - 1) * usersPerPage + 1,
                          filteredUsers.length
                        )}{" "}
                        to{" "}
                        {Math.min(
                          currentPage * usersPerPage,
                          filteredUsers.length
                        )}{" "}
                        of {filteredUsers.length} users
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="px-3 py-1"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    currentPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={createPageSelectHandler(pageNum)}
                                  className="px-3 py-1 text-xs min-w-[32px]"
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNextPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  );
                })()}
                </div>
              );
            })()}
          </CardContent>
        )}
      </Card>

      <div>
        {(() => {
          if (!selectedUser) {
            return (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 opacity-20" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a User
                  </h3>
                  <p className="text-gray-500">
                    Choose a user from above to manage their documents
                  </p>
                </CardContent>
              </Card>
            );
          }
          
          if (userDetailsLoading) {
            return (
              <Card>
                <CardContent className="text-center py-12">
                  Loading user details...
                </CardContent>
              </Card>
            );
          }
          
          if (userDetailsError) {
            return (
              <Card>
                <CardContent className="text-center py-12 text-red-500">
                  {userDetailsError}
                </CardContent>
              </Card>
            );
          }
          
          if (userDetails) {
            return (
              <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Files from User</CardTitle>
                      {!isFilesFromUserCollapsed && (
                        <CardDescription>
                          Files uploaded by the user, and their archived files.
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setIsFilesFromUserCollapsed(!isFilesFromUserCollapsed)
                      }
                      className="h-8 w-8 p-0"
                    >
                      {isFilesFromUserCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {isFilesFromUserCollapsed && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-3 h-3 text-green-600" />
                      </div>
                      <span>Files from User</span>
                    </div>
                  )}
                </CardHeader>
                {!isFilesFromUserCollapsed && (
                  <CardContent>
                    <Tabs defaultValue="uploaded">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                      </TabsList>
                      <TabsContent value="uploaded" className="pt-4">
                        {(() => {
                          const uploadedHandlers =
                            createClipboardHandlers("uploaded");
                          const selectedUserData = users.find((u) => u.id === selectedUser);

                          return (
                            <FileBrowser
                              files={processedUploadedFiles}
                              folders={processedUploadedFolders}
                              isLoading={userDetailsLoading}
                              currentFolderId={uploadedFilesFolderId}
                              onFolderChange={handleUploadedFolderChange}
                              breadcrumbPath={uploadedBreadcrumbPath}
                              onRefresh={handleRefreshUserDetails}
                              showAddFolderButton={false}
                              showUploadButton={false}
                              showUploadFolderButton={false}
                              isUploading={false}
                              handleFileSelect={() => {}}
                              handleFileUpload={() => {}}
                              selectedFiles={[]}
                              onRemoveSelectedFile={() => {}}
                              onClearSelectedFiles={() => {}}
                              onSelectedFileNameChange={() => {}}
                              onFileArchive={handleArchiveFile}
                              onFolderArchive={handleArchiveFolder}
                              theme="user"
                              storageUsedKB={selectedUserData?.storageUsed}
                              maxStorageLimitKB={selectedUserData?.maxStorageLimit}
                              storageSubjectName={selectedUserData?.name || selectedUserData?.email}
                              // Clipboard props
                              clipboardItems={uploadedHandlers.clipboard.items}
                              clipboardOperation={
                                uploadedHandlers.clipboard.operation
                              }
                              onCopyItems={uploadedHandlers.handleCopyItems}
                              onCutItems={uploadedHandlers.handleCutItems}
                              onPasteItems={uploadedHandlers.handlePasteItems}
                              onClearClipboard={
                                uploadedHandlers.handleClearClipboard
                              }
                              selectedItemsForClipboard={
                                uploadedHandlers.clipboard.selectedItems
                              }
                              onToggleItemSelection={
                                uploadedHandlers.handleToggleItemSelection
                              }
                              onSelectAllItems={
                                uploadedHandlers.handleSelectAllItems
                              }
                              onClearSelection={
                                uploadedHandlers.handleClearSelection
                              }
                              showClipboardActions={true}
                              isPasting={uploadedHandlers.isPasting}
                            />
                          );
                        })()}
                      </TabsContent>
                      <TabsContent value="archived" className="pt-4">
                        {(() => {
                          const archivedHandlers =
                            createClipboardHandlers("archived");
                          const selectedUserData = users.find((u) => u.id === selectedUser);
                          return (
                            <FileBrowser
                              files={processedArchivedFiles}
                              folders={processedArchivedFolders}
                              isLoading={userDetailsLoading}
                              currentFolderId={archivedFilesFolderId}
                              onFolderChange={handleArchivedFolderChange}
                              breadcrumbPath={archivedBreadcrumbPath}
                              onRefresh={handleRefreshUserDetails}
                              onFileUnarchive={handleUnarchiveFile}
                              onFolderUnarchive={handleUnarchiveFolder}
                              showAddFolderButton={false}
                              showUploadButton={false}
                              showUploadFolderButton={false}
                              isUploading={false}
                              handleFileSelect={() => {}}
                              handleFileUpload={() => {}}
                              selectedFiles={[]}
                              onRemoveSelectedFile={() => {}}
                              onClearSelectedFiles={() => {}}
                              onSelectedFileNameChange={() => {}}
                              theme="archive"
                              storageUsedKB={selectedUserData?.storageUsed}
                              maxStorageLimitKB={selectedUserData?.maxStorageLimit}
                              storageSubjectName={selectedUserData?.name || selectedUserData?.email}
                              // Clipboard props
                              clipboardItems={archivedHandlers.clipboard.items}
                              clipboardOperation={
                                archivedHandlers.clipboard.operation
                              }
                              onCopyItems={archivedHandlers.handleCopyItems}
                              onCutItems={archivedHandlers.handleCutItems}
                              onPasteItems={archivedHandlers.handlePasteItems}
                              onClearClipboard={
                                archivedHandlers.handleClearClipboard
                              }
                              selectedItemsForClipboard={
                                archivedHandlers.clipboard.selectedItems
                              }
                              onToggleItemSelection={
                                archivedHandlers.handleToggleItemSelection
                              }
                              onSelectAllItems={
                                archivedHandlers.handleSelectAllItems
                              }
                              onClearSelection={
                                archivedHandlers.handleClearSelection
                              }
                              showClipboardActions={false}
                              isPasting={archivedHandlers.isPasting}
                            />
                          );
                        })()}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Document Management</CardTitle>
                      {!isDocumentManagementCollapsed && (
                        <CardDescription>
                          Manage private and response documents for this user
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setIsDocumentManagementCollapsed(
                          !isDocumentManagementCollapsed
                        )
                      }
                      className="h-8 w-8 p-0"
                    >
                      {isDocumentManagementCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {isDocumentManagementCollapsed && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-3 h-3 text-purple-600" />
                      </div>
                      <span>Document Management</span>
                    </div>
                  )}
                </CardHeader>
                {!isDocumentManagementCollapsed && (
                  <CardContent>
                    <Tabs defaultValue="private" className="w-full">
                      <TabsList className="flex flex-col sm:flex-row gap-2 w-full bg-gray-100">
                        <TabsTrigger
                          value="private"
                          className="w-full flex-1 flex items-center justify-center bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900"
                        >
                          <EyeOff className="w-4 h-4" />
                          <span>Work in Progress - Internal Use</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="response"
                          className="w-full flex-1 flex items-center justify-center bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Response Documents</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="private" className="space-y-4 pt-4">
                        {(() => {
                          const privateHandlers =
                            createClipboardHandlers("private");
                          const selectedUserData = users.find((u) => u.id === selectedUser);
                          return (
                            <FileBrowser
                              files={processedPrivateFiles}
                              folders={processedPrivateFolders}
                              isLoading={userDetailsLoading}
                              currentFolderId={privateFilesFolderId}
                              onFolderChange={handlePrivateFolderChange}
                              breadcrumbPath={privateBreadcrumbPath}
                              onRefresh={handleRefreshUserDetails}
                              onFolderCreate={(name) =>
                                handleAdminFolderCreate(name, "private")
                              }
                              onRenameFile={handlePrivateRenameFile}
                              onRenameFolder={handlePrivateRenameFolder}
                              onDeleteFile={handlePrivateDeleteFile}
                              onDeleteFolder={handlePrivateDeleteFolder}
                              isUploading={isPrivateBatchUploading}
                              handleFileSelect={handlePrivateFileInputChange}
                              handleFileUpload={handlePrivateFileUploadById}
                              handleConfirmAll={handlePrivateConfirmAll}
                              selectedFiles={privateSelectedFiles.map((f) => ({
                                id: f.id,
                                name: f.name,
                              }))}
                              onRemoveSelectedFile={
                                handleRemovePrivateSelectedFile
                              }
                              onClearSelectedFiles={
                                handleClearPrivateSelectedFiles
                              }
                              onSelectedFileNameChange={
                                handlePrivateSelectedFileNameChange
                              }
                              theme="admin-private"
                              uploadingIds={privateUploadingIds}
                              showUploadFolderButton={false}
                              isBatchUploading={isPrivateBatchUploading}
                              showMultiLevelUploadButton={true}
                              storageUsedKB={selectedUserData?.storageUsed}
                              maxStorageLimitKB={selectedUserData?.maxStorageLimit}
                              storageSubjectName={selectedUserData?.name || selectedUserData?.email}
                              showStorageBanner={false}
                              onMultiLevelFolderCreate={(name, parentId) =>
                                handleAdminMultiLevelFolderCreate(
                                  name,
                                  parentId,
                                  "private"
                                )
                              }
                              onMultiLevelFileUpload={(file, name, parentId) =>
                                handleAdminMultiLevelFileUpload(
                                  file,
                                  name,
                                  parentId,
                                  "private"
                                )
                              }
                              // Clipboard props
                              clipboardItems={privateHandlers.clipboard.items}
                              clipboardOperation={
                                privateHandlers.clipboard.operation
                              }
                              onCopyItems={privateHandlers.handleCopyItems}
                              onCutItems={privateHandlers.handleCutItems}
                              onPasteItems={privateHandlers.handlePasteItems}
                              onClearClipboard={
                                privateHandlers.handleClearClipboard
                              }
                              selectedItemsForClipboard={
                                privateHandlers.clipboard.selectedItems
                              }
                              onToggleItemSelection={
                                privateHandlers.handleToggleItemSelection
                              }
                              onSelectAllItems={
                                privateHandlers.handleSelectAllItems
                              }
                              onClearSelection={
                                privateHandlers.handleClearSelection
                              }
                              showClipboardActions={true}
                              isPasting={privateHandlers.isPasting}
                            />
                          );
                        })()}
                      </TabsContent>

                      <TabsContent value="response" className="space-y-4 pt-4">
                        {(() => {
                          const responseHandlers =
                            createClipboardHandlers("response");
                          const selectedUserData = users.find((u) => u.id === selectedUser);
                          return (
                            <FileBrowser
                              files={processedResponseFiles}
                              folders={processedResponseFolders}
                              isLoading={userDetailsLoading}
                              currentFolderId={responseFilesFolderId}
                              onFolderChange={handleResponseFolderChange}
                              breadcrumbPath={responseBreadcrumbPath}
                              onRefresh={handleRefreshUserDetails}
                              onFolderCreate={(name) =>
                                handleAdminFolderCreate(name, "response")
                              }
                              onRenameFile={handleResponseRenameFile}
                              onRenameFolder={handleResponseRenameFolder}
                              onDeleteFile={handleResponseDeleteFile}
                              onDeleteFolder={handleResponseDeleteFolder}
                              isUploading={isResponseBatchUploading}
                              handleFileSelect={handleResponseFileInputChange}
                              handleFileUpload={handleResponseFileUploadById}
                              handleConfirmAll={handleResponseConfirmAll}
                              selectedFiles={responseSelectedFiles.map((f) => ({
                                id: f.id,
                                name: f.name,
                              }))}
                              onRemoveSelectedFile={
                                handleRemoveResponseSelectedFile
                              }
                              onClearSelectedFiles={
                                handleClearResponseSelectedFiles
                              }
                              onSelectedFileNameChange={
                                handleResponseSelectedFileNameChange
                              }
                              theme="admin-response"
                              uploadingIds={responseUploadingIds}
                              showUploadFolderButton={false}
                              isBatchUploading={isResponseBatchUploading}
                              showMultiLevelUploadButton={true}
                              storageUsedKB={selectedUserData?.storageUsed}
                              maxStorageLimitKB={selectedUserData?.maxStorageLimit}
                              storageSubjectName={selectedUserData?.name || selectedUserData?.email}
                              showStorageBanner={false}
                              onMultiLevelFolderCreate={(name, parentId) =>
                                handleAdminMultiLevelFolderCreate(
                                  name,
                                  parentId,
                                  "response"
                                )
                              }
                              onMultiLevelFileUpload={(file, name, parentId) =>
                                handleAdminMultiLevelFileUpload(
                                  file,
                                  name,
                                  parentId,
                                  "response"
                                )
                              }
                              // Clipboard props
                              clipboardItems={responseHandlers.clipboard.items}
                              clipboardOperation={
                                responseHandlers.clipboard.operation
                              }
                              onCopyItems={responseHandlers.handleCopyItems}
                              onCutItems={responseHandlers.handleCutItems}
                              onPasteItems={responseHandlers.handlePasteItems}
                              onClearClipboard={
                                responseHandlers.handleClearClipboard
                              }
                              selectedItemsForClipboard={
                                responseHandlers.clipboard.selectedItems
                              }
                              onToggleItemSelection={
                                responseHandlers.handleToggleItemSelection
                              }
                              onSelectAllItems={
                                responseHandlers.handleSelectAllItems
                              }
                              onClearSelection={
                                responseHandlers.handleClearSelection
                              }
                              showClipboardActions={true}
                              isPasting={responseHandlers.isPasting}
                            />
                          );
                        })()}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            </div>
            );
          }
          
          return null;
        })()}
      </div>
    </div>
  );
}
