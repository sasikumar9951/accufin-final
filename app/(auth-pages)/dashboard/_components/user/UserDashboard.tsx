"use client";
import { useState, useEffect, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { apiFetch } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import { s3 } from "@/lib/s3";
import toast from "react-hot-toast";
import UserDashboardHeader from "./UserDashboardHeader";
import ResponsesTab from "./ResponsesTab";
import FormsTab from "./FormsTab";
import NotificationsTab from "./NotificationsTab";
import { ManagedFile } from "@/types/files";
import FileBrowser from "@/app/_component/FileBrowser";
import ArchiveTab from "./ArchiveTab";
import { v4 as uuidv4 } from "uuid";
import useHeartbeat from "@/hooks/use-heartbeat";
import ProfileManagement from "./ProfileManagement";
import { Loader } from "@/components/ui/loader";

type ClipboardItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  parentFolderId: string | null;
};

type FileRecord = {
  id: string;
  url: string;
  path: string;
  name: string | null;
  size: string | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
  completedAt: string | null;
  folderName?: string | null;
  parentFolderId?: string | null;
  isArchived: boolean;
  file: globalThis.File;
};

type SelectedFile = {
  id: string;
  url: string;
  path: string;
  name: string;
  size: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  file: globalThis.File;
};

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<
    "upload" | "responses" | "notifications" | "forms" | "profile" | "archive"
  >("upload");
  const router = useRouter();
  const { data: session } = useSession();
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [maxStorageLimit, setMaxStorageLimit] = useState<number>(0);
  const [showStorageBanner, setShowStorageBanner] = useState<boolean>(true);

  // Initialize heartbeat for online status tracking
  useHeartbeat();
  // Notifications state for header count
  const [notifications, setNotifications] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  // Multiple selection queue
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadingIds, setUploadingIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [archivedFilesList, setArchivedFilesList] = useState<FileRecord[]>([]);
  const [currentArchiveFolderId, setCurrentArchiveFolderId] = useState<
    string | null
  >(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<
    { id: string; name: string }[]
  >([]);

  const [archiveBreadcrumbPath, setArchiveBreadcrumbPath] = useState<
    { id: string; name: string }[]
  >([]);

  // Clipboard state
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [clipboardOperation, setClipboardOperation] = useState<
    "copy" | "cut" | null
  >(null);
  const [selectedItemsForClipboard, setSelectedItemsForClipboard] = useState<
    string[]
  >([]);
  const [isPasting, setIsPasting] = useState(false);

  // Small helpers to reduce duplication
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

  const getUnreadCount = (list: any[]) => list.filter((n: any) => !n.isRead).length;

  const mapToManagedFiles = (list: FileRecord[]): ManagedFile[] =>
    list.map((file) => ({
      id: file.id,
      name: file.name || "Unnamed File",
      url: file.url,
      size: file.size,
      createdAt: file.createdAt,
      folderName: file.folderName,
      parentFolderId: file.parentFolderId,
    }));

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uploadedFilesRes, archivedFilesRes, userInfoRes] =
        await Promise.all([
          apiFetch("/api/user/listUploadedFile", { logoutOn401: false }),
          apiFetch("/api/user/archived-files", { logoutOn401: false }),
          apiFetch("/api/user/info", { logoutOn401: false }),
        ]);

      const [uploadedFilesData, archivedFilesData, userInfo] =
        await Promise.all([
          uploadedFilesRes.json(),
          archivedFilesRes.json(),
          userInfoRes.json(),
        ]);

      setUploadedFiles(
        Array.isArray(uploadedFilesData) ? uploadedFilesData : []
      );
      setArchivedFilesList(
        Array.isArray(archivedFilesData) ? archivedFilesData : []
      );
      if (userInfo && typeof userInfo.storageUsed === "number") {
        setStorageUsed(userInfo.storageUsed || 0);
        setMaxStorageLimit(userInfo.maxStorageLimit || 0);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Ensure state is an array even on catastrophic failure
      setUploadedFiles([]);
      setArchivedFilesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch notifications on mount for header count
  useEffect(() => {
    apiFetch("/api/user/notification", { logoutOn401: false })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to fetch notifications"))))
      .then((notificationsData) => {
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      })
      .catch(() => {
        // Intentionally ignore to avoid blocking the UI
      });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newItems = createSelectedFilesFromList(e.target.files);
    if (newItems.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const handleRemoveSelectedFile = (selectedTempId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== selectedTempId));
  };

  const handleClearSelectedFiles = () => {
    setSelectedFiles([]);
  };

  const handleSelectedFileNameChange = (
    selectedTempId: string,
    newName: string
  ) => {
    setSelectedFiles((prev) =>
      prev.map((f) => (f.id === selectedTempId ? { ...f, name: newName } : f))
    );
  };

  const uploadOne = async (sf: SelectedFile, updateState: boolean = true) => {
    if (!session?.user?.id) return false;
    // Block upload if at/over 100%
    if (maxStorageLimit > 0 && storageUsed >= maxStorageLimit) {
      toast.error("Your storage is full. Please free space or upgrade.");
      return false;
    }
    if (currentFolderId === null) {
      toast.error("Please select or create a folder before uploading a file.");
      return false;
    }
    try {
      setUploadingIds((prev) => [...prev, sf.id]);
      const filePath = s3.getUserSendingFilePath(
        session.user.id,
        sf.name,
        currentFolderId
      );
      const signedUrlRes = await apiFetch("/api/s3/put", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath,
          contentType: sf.type,
        }),
        logoutOn401: false,
      });
      if (!signedUrlRes.ok) {
        toast.error("Failed to get signed URL. Try again, please.");
        return false;
      }
      const { signedUrl } = await signedUrlRes.json();
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: sf.file,
        headers: {
          "Content-Type": sf.type,
        },
      });
      if (!uploadRes.ok) {
        toast.error("Failed to upload file. Try again, please.");
        return false;
      }
      const dbRes = await apiFetch("/api/s3/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath,
          url: signedUrl,
          name: sf.name,
          size: sf.size,
          type: sf.type,
          uploadedById: session.user.id,
          isAdminOnlyPrivateFile: false,
          parentFolderId: currentFolderId,
        }),
        logoutOn401: false,
      });
      if (!dbRes.ok) {
        toast.error("Failed to store file info. Try again, please.");
        return false;
      }
      const newFile = await dbRes.json();
      // Refresh usage locally by re-fetching user info
      try {
        const res = await apiFetch("/api/user/info", { logoutOn401: false });
        if (res.ok) {
          const info = await res.json();
          setStorageUsed(info.storageUsed || 0);
          setMaxStorageLimit(info.maxStorageLimit || 0);
        }
      } catch {}
      if (updateState) {
        setUploadedFiles((prev) => [newFile, ...prev]);
      }
      return true;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Error uploading file. Please try again.");
      return false;
    } finally {
      setUploadingIds((prev) => prev.filter((id) => id !== sf.id));
    }
  };

  const handleFileUploadById = async (selectedTempId: string) => {
    const sf = selectedFiles.find((f) => f.id === selectedTempId);
    if (!sf) return;
    setIsUploading(true);
    const ok = await uploadOne(sf);
    if (ok) {
      setSelectedFiles((prev) => prev.filter((f) => f.id !== selectedTempId));
      await fetchData();
      toast.success(`${sf.name} uploaded successfully!`);
    }
    setIsUploading(false);
  };

  const handleConfirmAll = async () => {
    if (selectedFiles.length === 0) return;
    if (maxStorageLimit > 0 && storageUsed >= maxStorageLimit) {
      toast.error("Your storage is full. Cannot upload files.");
      return;
    }
    setIsUploading(true);
    setIsBatchUploading(true);
    const successfullyUploaded: string[] = [];
    const currentUploadedFiles = [...uploadedFiles]; // Create a copy to track newly uploaded files

    try {
      for (const sf of selectedFiles) {
        // Skip if duplicate name exists in current view or in files we've already processed
        const duplicate = currentUploadedFiles.some(
          (f) => f.name === sf.name && f.parentFolderId === currentFolderId
        );
        if (duplicate) {
          successfullyUploaded.push(sf.id); // Mark as "processed" even if skipped
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const success = await uploadOne(sf, false); // Don't update state during batch upload
        if (success) {
          successfullyUploaded.push(sf.id);
          // Add the newly uploaded file to our tracking array to prevent duplicates in the same batch
          currentUploadedFiles.push({
            id: sf.id,
            name: sf.name,
            parentFolderId: currentFolderId,
          } as any);
        }
      }

      // Remove successfully uploaded files from selected files list
      setSelectedFiles((prev) =>
        prev.filter((f) => !successfullyUploaded.includes(f.id))
      );
      await fetchData(); // This will refresh the uploaded files list
      toast.success("All files uploaded successfully.");
    } finally {
      setIsUploading(false);
      setIsBatchUploading(false);
    }
  };

  const handleFolderCreate = async (folderName: string) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to create a folder.");
      return;
    }

    try {
      // Avoid duplicate folder names within the same parent folder
      const siblingFolders = uploadedFiles.filter(
        (f) => f.parentFolderId === currentFolderId && f.type === "folder"
      );
      const siblingNames = new Set(
        siblingFolders.map((f) => (f.name || "").toLowerCase())
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

      const res = await apiFetch("/api/s3/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFolderCreation: true,
          folderName: finalName,
          parentFolderId: currentFolderId,
        }),
        logoutOn401: false,
      });

      if (!res.ok) {
        throw new Error("Failed to create folder.");
      }

      const createdFolder = await res.json();

      // Add the created folder to the uploaded files list
      setUploadedFiles((prev) => [createdFolder, ...prev]);

      toast.success(`Folder "${finalName}" created successfully!`);
      await fetchData(); // Refresh data to ensure consistency
    } catch (error) {
      toast.error("Failed to create folder. Please try again.");
      console.error("Error creating folder:", error);
    }
  };

  const handleFolderChange = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setBreadcrumbPath(buildBreadcrumbPath(folderId, uploadedFiles));
  };



  const handleArchiveFolderChange = (folderId: string | null) => {
    setCurrentArchiveFolderId(folderId);
    setArchiveBreadcrumbPath(buildBreadcrumbPath(folderId, archivedFilesList));
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (!file) return;

    const prevName = file.name;
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
    try {
      const res = await apiFetch(`/api/user/files/${fileId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName }),
        logoutOn401: false,
      });
      if (!res.ok) throw new Error("Failed");
      await fetchData();
      toast.success("Renamed successfully");
    } catch (error) {
      console.error("Error renaming file:", error);
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, name: prevName } : f))
      );
      toast.error("Failed to rename. Try again.");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    const folderEntry = uploadedFiles.find(
      (f) => f.id === folderId && f.type === "folder"
    );

    if (!folderEntry) {
      toast.error("Folder not found");
      return;
    }

    // Optimistic update
    const prevState = uploadedFiles;
    setUploadedFiles((prev) =>
      prev.map((f) => {
        if (f.id === folderId) return { ...f, name: newName };
        return f;
      })
    );

    try {
      const res = await apiFetch(`/api/user/folders/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, newName }),
        logoutOn401: false,
      });
      if (!res.ok) throw new Error("Failed");
      await fetchData();
      toast.success("Folder renamed");
    } catch (error) {
      console.error("Error renaming folder:", error);
      setUploadedFiles(prevState);
      toast.error("Failed to rename folder");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (!file) return;
    const prev = uploadedFiles;
    setUploadedFiles((p) => p.filter((f) => f.id !== fileId));
    try {
      const res = await apiFetch(`/api/user/files/${fileId}`, {
        method: "DELETE",
        logoutOn401: false,
      });
      if (!res.ok) throw new Error("Failed");
      await fetchData();
      toast.success("Deleted");
    } catch (error) {
      console.error("Error deleting file:", error);
      setUploadedFiles(prev);
      toast.error("Failed to delete");
    }
  };

  const handleDeleteArchivedFile = async (fileId: string) => {
    const file = archivedFilesList.find((f) => f.id === fileId);
    if (!file) return;
    const prev = archivedFilesList;
    setArchivedFilesList((p) => p.filter((f) => f.id !== fileId));
    try {
      const res = await apiFetch(`/api/user/files/${fileId}`, {
        method: "DELETE",
        logoutOn401: false,
      });
      if (!res.ok) throw new Error("Failed");
      await fetchData();
      toast.success("Deleted");
    } catch (error) {
      console.error("Error deleting archived file:", error);
      setArchivedFilesList(prev);
      toast.error("Failed to delete");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folderEntry = uploadedFiles.find(
      (f) => f.id === folderId && f.type === "folder"
    );

    if (!folderEntry) {
      toast.error("Folder not found");
      return;
    }

    // Optimistic update - remove folder and all its descendants
    const getAllDescendants = (parentId: string): string[] => {
      const children = uploadedFiles.filter(
        (f) => f.parentFolderId === parentId
      );
      let allIds = [parentId];
      for (const child of children) {
        if (child.type === "folder") {
          allIds = allIds.concat(getAllDescendants(child.id));
        } else {
          allIds.push(child.id);
        }
      }
      return allIds;
    };

    const allFileIds = getAllDescendants(folderId);
    const prev = uploadedFiles;
    setUploadedFiles((p) => p.filter((f) => !allFileIds.includes(f.id)));

    try {
      const res = await apiFetch(`/api/user/folders/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
        logoutOn401: false,
      });
      if (!res.ok) throw new Error("Failed");
      await fetchData();
      toast.success("Folder deleted");
    } catch (error) {
      console.error("Error deleting folder:", error);
      setUploadedFiles(prev);
      toast.error("Failed to delete folder");
    }
  };

  const handleArchiveFile = async (fileId: string) => {
    const fileToMove = uploadedFiles.find((f) => f.id === fileId);
    if (!fileToMove) return;

    // Optimistic UI update
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setArchivedFilesList((prev) => [
      ...prev,
      { ...fileToMove, isArchived: true },
    ]);
    toast.success("File archived.");

    try {
      const res = await apiFetch(`/api/user/files/${fileId}/archive`, {
        method: "PATCH",
        logoutOn401: false,
      });
      if (!res.ok) {
        toast.error("Failed to archive file.");
        // Revert on error
        setUploadedFiles((prev) => [...prev, fileToMove]);
        setArchivedFilesList((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (error) {
      console.error("Error archiving file:", error);
      toast.error("Failed to archive file. Please try again.");
      setUploadedFiles((prev) => [...prev, fileToMove]);
      setArchivedFilesList((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

  const handleArchiveFolder = async (folderId: string) => {
    try {
      const res = await apiFetch(`/api/user/folders/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
        logoutOn401: false,
      });
      if (!res.ok) throw new Error("Failed to archive folder");
      const result = await res.json();
      toast.success(
        `Folder archived successfully (${result.archivedCount} items moved)`
      );
      await fetchData(); // Refresh all data
    } catch (error) {
      console.error("Error archiving folder:", error);
      toast.error("Failed to archive folder");
    }
  };

  const handleUnarchiveFile = async (fileId: string) => {
    const fileToMove = archivedFilesList.find((f) => f.id === fileId);
    if (!fileToMove) return;

    // Optimistic UI update
    setArchivedFilesList((prev) => prev.filter((f) => f.id !== fileId));
    setUploadedFiles((prev) => [...prev, { ...fileToMove, isArchived: false }]);
    toast.success("File unarchived.");

    try {
      const res = await fetch(`/api/user/files/${fileId}/unarchive`, {
        method: "PATCH",
      });
      if (!res.ok) {
        toast.error("Failed to unarchive file.");
        // Revert on error
        setArchivedFilesList((prev) => [...prev, fileToMove]);
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (error) {
      console.error("Error unarchiving file:", error);
      toast.error("Failed to unarchive file. Please try again.");
      setArchivedFilesList((prev) => [...prev, fileToMove]);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

  const handleUnarchiveFolder = async (folderId: string) => {
    try {
      const res = await apiFetch(`/api/user/folders/unarchive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
        logoutOn401: false,
      });

      if (res.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }

      if (!res.ok) throw new Error("Failed to unarchive folder");
      const result = await res.json();
      toast.success(
        `Folder unarchived successfully (${result.unarchivedCount} items moved)`
      );
      await fetchData(); // Refresh all data
    } catch (error) {
      console.error("Error unarchiving folder:", error);
      toast.error("Failed to unarchive folder");
    }
  };

  // Clipboard handlers
  const handleCopyItems = (items: ClipboardItem[]) => {
    setClipboardItems(items);
    setClipboardOperation("copy");
    setSelectedItemsForClipboard([]);
  };

  const handleCutItems = (items: ClipboardItem[]) => {
    setClipboardItems(items);
    setClipboardOperation("cut");
    setSelectedItemsForClipboard([]);
  };

  const handlePasteItems = async (targetFolderId: string | null) => {
    if (!clipboardItems.length || !clipboardOperation) return;

    setIsPasting(true);
    try {
      const itemsToMove = clipboardItems.map((item) => ({
        id: item.id,
        type: item.type,
      }));

      if (clipboardOperation === "cut") {
        // Move items
        try {
          const response = await apiFetch("/api/user/files/bulk-move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: itemsToMove,
              targetFolderId,
            }),
            logoutOn401: false,
          });

          if (response.status === 401) {
            const { signOut } = await import("next-auth/react");
            signOut();
            return;
          }

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to move items");
          }
        } catch (err) {
          throw err;
        }

        // Clear clipboard after successful cut
        setClipboardItems([]);
        setClipboardOperation(null);
        toast.success("Items moved successfully");
      } else if (clipboardOperation === "copy") {
        // Copy items
        try {
          const response = await apiFetch("/api/user/files/bulk-copy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: itemsToMove,
              targetFolderId,
            }),
            logoutOn401: false,
          });

          if (response.status === 401) {
            const { signOut } = await import("next-auth/react");
            signOut();
            return;
          }

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to copy items");
          }
        } catch (err) {
          throw err;
        }

        // Don't clear clipboard after copy - allow multiple pastes
        toast.success("Items copied successfully");
      }

      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error("Error pasting items:", error);
      toast.error(error.message || "Failed to paste items");
    } finally {
      setIsPasting(false);
    }
  };

  const handleClearClipboard = () => {
    setClipboardItems([]);
    setClipboardOperation(null);
  };

  const handleToggleItemSelection = (
    itemId: string
  ) => {
    setSelectedItemsForClipboard((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAllItems = () => {
    let allItemIds: string[] = [];

    // Get items based on active tab
    if (activeTab === "upload") {
      allItemIds = [
        ...displayedFiles.map((f) => f.id),
        ...displayedFolders.map((f) => f.id),
      ];
    } else if (activeTab === "archive") {
      allItemIds = [
        ...displayedArchivedFiles.map((f) => f.id),
        ...displayedArchivedFolders.map((f) => f.id),
      ];
    }

    setSelectedItemsForClipboard(allItemIds);
  };

  const handleClearSelection = () => {
    setSelectedItemsForClipboard([]);
  };

  // Multi-level folder upload handlers
  const handleMultiLevelFolderCreate = async (
    name: string,
    parentId: string | null
  ): Promise<{ id: string }> => {
    if (!session?.user?.id) {
      throw new Error("You must be logged in to create a folder.");
    }

    try {
      // Avoid duplicate folder names within the same parent folder
      const siblingFolders = uploadedFiles.filter(
        (f) => f.parentFolderId === parentId && f.type === "folder"
      );
      const siblingNames = new Set(
        siblingFolders.map((f) => (f.name || "").toLowerCase())
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

      const res = await apiFetch("/api/s3/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isFolderCreation: true,
          folderName: finalName,
          parentFolderId: parentId,
        }),
        logoutOn401: false,
      });

      if (res.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        throw new Error("Failed to create folder.");
      }

      const newFolder = await res.json();
      console.log(`Created folder: ${finalName} with ID: ${newFolder.id}`);
      return { id: newFolder.id };
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  };

  const handleMultiLevelFileUpload = async (
    file: File,
    name: string,
    parentId: string
  ): Promise<boolean> => {
    if (!session?.user?.id) {
      throw new Error("You must be logged in to upload files.");
    }

    try {
      const filePath = s3.getUserSendingFilePath(
        session.user.id,
        name,
        parentId
      );

      // Get signed URL
      const signedUrlRes = await apiFetch("/api/s3/put", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath,
          contentType: file.type,
        }),
        logoutOn401: false,
      });

      if (signedUrlRes.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        throw new Error("Unauthorized");
      }

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
      const dbRes = await apiFetch("/api/s3/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath,
          url: signedUrl,
          name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type,
          uploadedById: session.user.id,
          isAdminOnlyPrivateFile: false,
          parentFolderId: parentId,
        }),
        logoutOn401: false,
      });

      if (dbRes.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        throw new Error("Unauthorized");
      }

      if (!dbRes.ok) {
        throw new Error("Failed to save file info to database");
      }

      console.log(`Uploaded file: ${name}`);
      return true;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  // Helper function to build breadcrumb path
  const buildBreadcrumbPath = (
    targetFolderId: string | null,
    allFiles: FileRecord[]
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

  const { files: displayedFiles, folders: displayedFolders } = useMemo(() => {
    const folders: { id: string; name: string }[] = [];
    const files: FileRecord[] = [];



    // Get files and folders in current directory
    for (const file of uploadedFiles) {
      if (file.parentFolderId === currentFolderId) {
        if (file.type === "folder") {
          folders.push({ id: file.id, name: file.name || "Unnamed Folder" });
        } else {
          files.push(file);
        }
      }
    }

    return {
      files,
      folders,
    };
  }, [uploadedFiles, currentFolderId]);



  const { files: displayedArchivedFiles, folders: displayedArchivedFolders } =
    useMemo(() => {
      const folders: { id: string; name: string }[] = [];
      const files: FileRecord[] = [];

      // Get files and folders in current directory
      for (const file of archivedFilesList) {
        if (file.parentFolderId === currentArchiveFolderId) {
          if (file.type === "folder") {
            folders.push({ id: file.id, name: file.name || "Unnamed Folder" });
          } else {
            files.push(file);
          }
        }
      }
      return { files, folders };
    }, [archivedFilesList, currentArchiveFolderId]);

  const managedFiles: ManagedFile[] = mapToManagedFiles(displayedFiles);



  const managedArchivedFiles: ManagedFile[] = mapToManagedFiles(displayedArchivedFiles);

  return (
    <div className="min-h-screen bg-cyan-50">
      <UserDashboardHeader
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        onLogout={async () => {
          await signOut({ callbackUrl: "/" });
          router.push("/");
        }}
        unreadNotificationsCount={getUnreadCount(notifications)}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {activeTab === "upload" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="inline-flex items-center rounded-md bg-cyan-600 p-2 text-white shadow hover:bg-cyan-700 disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-3.51-7.07" />
                  <polyline points="22 3 21 7 17 6" />
                </svg>
              </button>
            </div>
            {isLoading && (
              <div className="w-full h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <Loader size={48} className="text-emerald-600 mb-3" />
                  <div className="text-sm text-gray-600">Loading dashboard...</div>
                </div>
              </div>
            )}
            {!isLoading && (
            <FileBrowser
              isRefreshing={isLoading}
              files={managedFiles}
              folders={displayedFolders}
              isLoading={isLoading}
              currentFolderId={currentFolderId}
              onFolderChange={handleFolderChange}
              onRefresh={fetchData}
              onFolderCreate={handleFolderCreate}
              onRenameFile={handleRenameFile}
              onRenameFolder={handleRenameFolder}
              onDeleteFile={handleDeleteFile}
              onDeleteFolder={handleDeleteFolder}
              isUploading={isUploading}
              handleFileSelect={handleFileSelect}
              handleFileUpload={handleFileUploadById}
              handleConfirmAll={handleConfirmAll}
              selectedFiles={selectedFiles.map((f) => ({
                id: f.id,
                name: f.name,
              }))}
              onRemoveSelectedFile={handleRemoveSelectedFile}
              onClearSelectedFiles={handleClearSelectedFiles}
              onSelectedFileNameChange={handleSelectedFileNameChange}
              onFileArchive={handleArchiveFile}
              onFolderArchive={handleArchiveFolder}
              theme="user"
              uploadingIds={uploadingIds}
              showUploadFolderButton={false}
              isBatchUploading={isBatchUploading}
              breadcrumbPath={breadcrumbPath}
              showMultiLevelUploadButton={true}
              onMultiLevelFolderCreate={handleMultiLevelFolderCreate}
              onMultiLevelFileUpload={handleMultiLevelFileUpload}
              // Clipboard props
              clipboardItems={clipboardItems}
              clipboardOperation={clipboardOperation}
              onCopyItems={handleCopyItems}
              onCutItems={handleCutItems}
              onPasteItems={handlePasteItems}
              onClearClipboard={handleClearClipboard}
              selectedItemsForClipboard={selectedItemsForClipboard}
              onToggleItemSelection={handleToggleItemSelection}
              onSelectAllItems={handleSelectAllItems}
              onClearSelection={handleClearSelection}
              showClipboardActions={true}
              isPasting={isPasting}
          storageUsedKB={storageUsed}
          maxStorageLimitKB={maxStorageLimit}
          showStorageBanner={showStorageBanner}
          onDismissStorageBanner={() => setShowStorageBanner(false)}
            />)}
          </div>
        )}
        {!isLoading && activeTab === "responses" && <ResponsesTab />}
        {!isLoading && activeTab === "forms" && <FormsTab />}
        {!isLoading && activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "archive" && (
          <ArchiveTab
            isRefreshing={isLoading}
            archivedFiles={managedArchivedFiles}
            folders={displayedArchivedFolders}
            isLoading={isLoading}
            currentFolderId={currentArchiveFolderId}
            onFolderChange={handleArchiveFolderChange}
            onRefresh={fetchData}
            onFileUnarchive={handleUnarchiveFile}
            onFolderUnarchive={handleUnarchiveFolder}
            onDeleteFile={handleDeleteArchivedFile}
            breadcrumbPath={archiveBreadcrumbPath}
            // Clipboard props
            clipboardItems={clipboardItems}
            clipboardOperation={clipboardOperation}
            onCopyItems={handleCopyItems}
            onCutItems={handleCutItems}
            onPasteItems={handlePasteItems}
            onClearClipboard={handleClearClipboard}
            selectedItemsForClipboard={selectedItemsForClipboard}
            onToggleItemSelection={handleToggleItemSelection}
            onSelectAllItems={handleSelectAllItems}
            onClearSelection={handleClearSelection}
            showClipboardActions={true}
            isPasting={isPasting}
          />
        )}
        {!isLoading && activeTab === "profile" && <ProfileManagement />}

      </div>
    </div>
  );
}
