"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Users,
  Download,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { User as PrismaUser } from "@prisma/client";
import CreateUserForm from "./CreateUserForm";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/client-api";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import * as XLSX from "xlsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UsersTableRow from "./UsersTableRow";
import UserManagementModals from "./UserManagementModals";

interface UserManagementProps {}

// Type aliases for union types
type DateValue = string | Date | null;
type StorageValue = number | null | undefined;

// Helper functions to reduce cognitive complexity
const getUserRowClassName = (user: any, onlineUsers: Set<string>): string => {
  if (!user.isActive) {
    return "bg-gradient-to-r from-red-50 to-pink-50 border-red-200 opacity-70";
  }
  if (onlineUsers.has(user.id)) {
    return "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm";
  }
  if (user.isAdmin) {
    return "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200";
  }
  return "bg-white";
};

const getAvatarRingClassName = (
  user: any,
  onlineUsers: Set<string>
): string => {
  if (!user.isActive) {
    return "ring-red-300";
  }
  if (onlineUsers.has(user.id)) {
    return "ring-green-500 animate-pulse";
  }
  if (user.isAdmin) {
    return "ring-yellow-500";
  }
  return "ring-emerald-100";
};

const getStatusBadgeClassName = (
  user: any,
  onlineUsers: Set<string>
): string => {
  if (!user.isActive) {
    return "text-white bg-red-500";
  }
  if (onlineUsers.has(user.id)) {
    return "text-white bg-green-500";
  }
  if (user.isAdmin) {
    return "text-white bg-yellow-500";
  }
  return "text-emerald-700 bg-white border border-emerald-200";
};

const getProgressBarColor = (percent: number): string => {
  if (percent >= 95) {
    return "bg-red-500";
  }
  if (percent >= 90) {
    return "bg-amber-500";
  }
  return "bg-emerald-500";
};

// Helper function to handle user restoration
const handleUserRestore = async (
  userId: string,
  restorableUsers: any[],
  setUserToRestore: (user: any) => void,
  setRestoreConfirmationText: (text: string) => void,
  setShowRestoreConfirmation: (show: boolean) => void
) => {
  setUserToRestore(
    restorableUsers
      .filter((u) => u.id === userId)
      .map((u) => ({ id: u.id, name: u.name, email: u.email }))[0] || null
  );
  setRestoreConfirmationText("");
  setShowRestoreConfirmation(true);
};

// Helper function to handle admin toggle
const handleUserAdminToggle = (
  userId: string,
  currentIsAdmin: boolean,
  users: any[],
  setSelectedUser: (user: any) => void,
  setShowAdminModal: (show: boolean) => void
) => {
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  setSelectedUser({
    id: userId,
    name: user.name || user.email,
    isAdmin: currentIsAdmin,
  });
  setShowAdminModal(true);
};

// Helper function to handle active toggle
const handleUserActiveToggle = (
  userId: string,
  currentIsActive: boolean,
  users: any[],
  setUserToToggleActive: (user: any) => void,
  setShowActiveToggleConfirmation: (show: boolean) => void
) => {
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  setUserToToggleActive({
    id: userId,
    name: user.name || user.email,
    currentStatus: currentIsActive,
  });
  setShowActiveToggleConfirmation(true);
};

// Helper function to format storage values
const formatStorageValue = (kb: StorageValue, showGB: boolean = false) => {
  const v = typeof kb === "number" ? kb : 0;
  if (showGB) {
    const mb = v / 1024;
    if (mb >= 100) {
      const gb = mb / 1024;
      return `${gb.toFixed(2)} GB`;
    }
    if (v >= 1000) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${v} KB`;
  }

  if (v >= 1000 * 1024) {
    const mb = v / 1024;
    if (mb >= 100) {
      const gb = mb / 1024;
      return `${gb.toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  }
  if (v >= 1000) {
    const mb = v / 1024;
    return `${mb.toFixed(2)} MB`;
  }
  return `${v} KB`;
};

// Helper function to calculate storage percentage
const calculateStoragePercent = (usedKb: StorageValue, maxKb: StorageValue) => {
  const used = typeof usedKb === "number" ? usedKb : 0;
  const max = typeof maxKb === "number" && maxKb > 0 ? maxKb : 0;
  if (max === 0) return 0;
  const percent = Math.round((used / max) * 100);
  return Math.min(100, Math.max(0, percent));
};

// Helper function to update online status
const updateOnlineStatus = async (
  markOfflineUsers: () => Promise<void>,
  fetchOnlineUsers: () => Promise<void>
) => {
  await markOfflineUsers();
  await fetchOnlineUsers();
};

// Helper function to sync pending activity
const syncPendingActivity = async () => {
  const pendingData = localStorage.getItem("pendingActivity");
  if (pendingData) {
    try {
      const activityData = JSON.parse(pendingData);

      try {
        const response = await apiFetch("/api/user/activity-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activityData),
          logoutOn401: false,
        });

        if (response.status === 401) {
          const { signOut } = await import("next-auth/react");
          signOut();
          return;
        }

        if (response.ok) {
          localStorage.removeItem("pendingActivity");
        }
      } catch (err) {
        console.error("Failed to sync pending activity:", err);
      }
    } catch (error) {
      console.error("Failed to sync pending activity:", error);
    }
  }
};

// Helper function to perform active toggle API call
const performActiveToggle = async (
  userToToggleActive: any,
  setUsersList: any,
  router: any,
  toast: any
) => {
  setUsersList((prev: any) =>
    prev.map((u: any) =>
      u.id === userToToggleActive.id
        ? { ...u, isActive: !userToToggleActive.currentStatus }
        : u
    )
  );

  try {
    try {
      const response = await apiFetch("/api/admin/toggle-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userToToggleActive.id,
          isActive: !userToToggleActive.currentStatus,
        }),
        logoutOn401: false,
      });

      if (response.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update active status");

      toast.success(data.message);
      router.refresh();
    } catch (e) {
      setUsersList((prev: any) =>
        prev.map((u: any) =>
          u.id === userToToggleActive.id
            ? { ...u, isActive: userToToggleActive.currentStatus }
            : u
        )
      );
      toast.error(e instanceof Error ? e.message : "Failed to update active status");
    }
  } catch (e) {
    setUsersList((prev: any) =>
      prev.map((u: any) =>
        u.id === userToToggleActive.id
          ? { ...u, isActive: userToToggleActive.currentStatus }
          : u
      )
    );
    toast.error(
      e instanceof Error ? e.message : "Failed to update active status"
    );
  }
};

// Helper function to perform admin toggle API call
const performAdminToggle = async (
  selectedUser: any,
  setUsersList: any,
  router: any,
  toast: any
) => {
  try {
    try {
      const response = await apiFetch("/api/admin/toggle-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          isAdmin: !selectedUser.isAdmin,
        }),
        logoutOn401: false,
      });

      if (response.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update admin status");
      }

      toast.success(data.message);

      setUsersList((prev: any) =>
        prev.map((u: any) =>
          u.id === selectedUser.id ? { ...u, isAdmin: !selectedUser.isAdmin } : u
        )
      );

      router.refresh();
    } catch (error) {
      console.error("Error toggling admin status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update admin status");
    }
  } catch (error) {
    console.error("Error toggling admin status:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to update admin status"
    );
  }
};

// Helper function to copy text to clipboard
const copyToClipboard = async (
  text: string,
  successMessage: string,
  errorMessage: string,
  toast: any
) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error(errorMessage);
  }
};

// Helper function to convert KB storage to GB for display in edit form
const convertStorageKbToGb = (maxStorageLimitKb: StorageValue): number => {
  const kb = Number(maxStorageLimitKb || 0);
  if (!kb || kb <= 0) return 0;
  const gb = kb / (1024 * 1024);
  return Math.round(gb * 100) / 100;
};

// Helper function to format date for input
const formatDateForInput = (date: DateValue): string => {
  if (!date) return "";
  try {
    return new Date(date as any).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

// Helper function to render storage progress bar
const renderStorageProgressBar = (
  percent: number,
  getProgressBarColor: (p: number) => string
) => {
  const barColor = percent >= 100 ? "bg-red-500" : getProgressBarColor(percent);
  return (
    <div className="mt-1 w-full px-1">
      <div className="h-1.5 w-full bg-gray-200 rounded">
        <div
          className={`${barColor} h-1.5 rounded`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
};

// Helper function to get row className based on storage status
const getUserRowClassNameWithStorage = (
  user: any,
  onlineUsers: Set<string>,
  storageUsed: number,
  maxStorageLimit: number
): string => {
  const percent = calculateStoragePercent(storageUsed, maxStorageLimit);
  if (percent >= 100) {
    return "bg-gradient-to-r from-red-100 to-rose-100 border-red-200";
  }
  return getUserRowClassName(user, onlineUsers);
};

// Helper function to get avatar ring className based on storage status
const getAvatarRingClassNameWithStorage = (
  user: any,
  onlineUsers: Set<string>,
  storageUsed: number,
  maxStorageLimit: number
): string => {
  const percent = calculateStoragePercent(storageUsed, maxStorageLimit);
  if (percent >= 100) {
    return "ring-red-500";
  }
  return getAvatarRingClassName(user, onlineUsers);
};

// Helper function to get status badge className based on storage status
const getStatusBadgeClassNameWithStorage = (
  user: any,
  onlineUsers: Set<string>,
  storageUsed: number,
  maxStorageLimit: number
): string => {
  const percent = calculateStoragePercent(storageUsed, maxStorageLimit);
  if (percent >= 100) {
    return "text-white bg-red-500";
  }
  return getStatusBadgeClassName(user, onlineUsers);
};

// Helper function to generate mock file data for view
const generateMockFileData = (user: any) => {
  return {
    userUploadedFiles: new Array(user.uploadedFiles)
      .fill({})
      .map((_, i) => ({ id: `uploaded-${i}`, name: `File ${i + 1}` })),
    userReceivedFiles: new Array(user.filesReceivedFromAdmin)
      .fill({})
      .map((_, i) => ({
        id: `received-${i}`,
        name: `Received File ${i + 1}`,
      })),
    userPrivateFiles: [],
    userArchivedFiles: [],
  };
};

// Helper function to render restorable users table rows
const renderRestorableUsersRows = (
  restorableUsers: any[],
  restorablePaginatedUsers: any[],
  restoringUserId: string | null,
  handleRestoreUser: (userId: string) => void,
  formatTimeLeft: (deleteAt: DateValue) => string
) => {
  if (restorableUsers.length === 0) {
    return (
      <tr>
        <td colSpan={9} className="py-8 text-center text-gray-500">
          No users scheduled for deletion
        </td>
      </tr>
    );
  }

  return restorablePaginatedUsers.map((u) => (
    <tr key={u.id} className="border-amber-100 bg-white hover:bg-amber-100">
      <td className="py-3 px-2 w-24">
        <div className="text-xs font-semibold text-gray-900 truncate max-w-20">
          {u.name || "No name"}
        </div>
      </td>
      <td className="py-3 px-2 w-32">
        <div className="text-xs text-amber-700 font-medium truncate max-w-28">
          {u.email || ""}
        </div>
      </td>
      <td className="py-3 px-2 w-24">
        <div className="text-xs text-gray-700 truncate max-w-20">
          {u.contactNumber || ""}
        </div>
      </td>
      <td className="py-3 px-2 w-24">
        <div className="text-xs text-gray-700 truncate max-w-20">
          {u.sinNumber || ""}
        </div>
      </td>
      <td className="py-3 px-2 w-28">
        <div className="text-xs text-gray-700 truncate max-w-24">
          {u.businessNumber || ""}
        </div>
      </td>
      <td className="py-3 px-2 w-24">
        <div className="text-xs text-gray-600">
          {new Date(u.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td className="py-3 px-2 w-32">
        <div className="text-xs text-gray-700">
          {u.deleteUserAt ? new Date(u.deleteUserAt).toLocaleString() : "-"}
        </div>
      </td>
      <td className="py-3 px-2 w-24">
        <div
          className={`text-xs font-medium ${
            formatTimeLeft(u.deleteUserAt) === "Expired"
              ? "text-red-600"
              : "text-amber-700"
          }`}
        >
          {formatTimeLeft(u.deleteUserAt)}
        </div>
      </td>
      <td className="py-3 px-2 w-24 text-center">
        <Button
          variant="outline"
          onClick={() => handleRestoreUser(u.id)}
          disabled={restoringUserId === u.id}
          className="px-3 py-1 border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          {restoringUserId === u.id ? (
            <>
              <Loader size={14} className="mr-2" /> Restoring...
            </>
          ) : (
            "Restore"
          )}
        </Button>
      </td>
    </tr>
  ));
};

// Helper function to mark offline users
const markOfflineUsers = async (router: any) => {
  try {
    try {
      const response = await apiFetch("/api/admin/mark-offline", {
        method: "POST",
        logoutOn401: false,
      });

      if (response.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }

      if (response.ok) {
        await response.json();
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to mark offline users:", error);
    }
  } catch (error) {
    console.error("Failed to mark offline users:", error);
  }
};

// Helper function to fetch online users
const fetchOnlineUsersData = async (
  setOnlineUsers: (users: Set<string>) => void
) => {
  try {
    try {
      const response = await apiFetch("/api/admin/online-users", { logoutOn401: false });
      if (response.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        const onlineUserIds = new Set(
          data.data.onlineUsersList.map((user: any) => user.id)
        );
        setOnlineUsers(onlineUserIds as Set<string>);
      }
    } catch (error) {
      console.error("Failed to fetch online users:", error);
    }
  } catch (error) {
    console.error("Failed to fetch online users:", error);
  }
};

export default function UserManagement(_props: UserManagementProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<
    (PrismaUser & {
      uploadedFiles: number;
      formResponses: number;
      filesReceivedFromAdmin: number;
      storageUsed?: number;
      maxStorageLimit?: number;
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<
    (PrismaUser & {
      uploadedFiles: number;
      formResponses: number;
      filesReceivedFromAdmin: number;
      storageUsed?: number;
      maxStorageLimit?: number;
    })[]
  >([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    isAdmin: boolean;
  } | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [viewUserBasic, setViewUserBasic] = useState<
    | (PrismaUser & {
        uploadedFiles: number;
        formResponses: number;
        filesReceivedFromAdmin: number;
      })
    | null
  >(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewData, setViewData] = useState<{
    userUploadedFiles: Array<{ id: string; name: string }>;
    userReceivedFiles: Array<{ id: string; name: string }>;
    userPrivateFiles: Array<any>;
    userArchivedFiles: Array<any>;
  } | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    contactNumber: "",
    occupation: "",
    sinNumber: "",
    businessNumber: "",
    dateOfBirth: "",
    address: "",
    sendBirthdayEmail: true,
    maxStorageLimitValue: 1,
    maxStorageUnit: "GB" as "KB" | "MB" | "GB",
  });
  const itemsPerPage = 10;
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
    email: string;
    uploadedFiles: number;
    filesReceivedFromAdmin: number;
    formResponses: number;
  } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [restorableUsers, setRestorableUsers] = useState<
    {
      id: string;
      name: string | null;
      email: string | null;
      contactNumber: string | null;
      sinNumber: string | null;
      businessNumber: string | null;
      createdAt: string | Date;
      deleteUserAt: string | Date | null;
      isRestorable: boolean;
      isActive: boolean;
    }[]
  >([]);
  const [restorableLoading, setRestorableLoading] = useState(false);
  const [restorableError, setRestorableError] = useState<string | null>(null);
  const [restoringUserId, setRestoringUserId] = useState<string | null>(null);
  const [restorableCurrentPage, setRestorableCurrentPage] = useState(1);
  const restorableItemsPerPage = 10;

  // New confirmation states
  const [showActiveToggleConfirmation, setShowActiveToggleConfirmation] =
    useState(false);
  const [activeToggleConfirmationText, setActiveToggleConfirmationText] =
    useState("");
  const [userToToggleActive, setUserToToggleActive] = useState<{
    id: string;
    name: string;
    currentStatus: boolean;
  } | null>(null);
  const [adminToggleConfirmationText, setAdminToggleConfirmationText] =
    useState("");
  const [showRestoreConfirmation, setShowRestoreConfirmation] = useState(false);
  const [restoreConfirmationText, setRestoreConfirmationText] = useState("");
  const [userToRestore, setUserToRestore] = useState<{
    id: string;
    name: string | null;
    email: string | null;
  } | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
      setUsersList(usersData);
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchRestorableUsers = async () => {
    setRestorableError(null);
    setRestorableLoading(true);
    try {
      const res = await apiFetch("/api/admin/users/restorable", { logoutOn401: false });
      if (res.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch restorable users");
      const data = await res.json();
      setRestorableUsers(data.users || []);
    } catch (err) {
      setRestorableError(
        err instanceof Error ? err.message : "Failed to load restorable users"
      );
    } finally {
      setRestorableLoading(false);
    }
  };

  useEffect(() => {
    fetchRestorableUsers();
  }, []);

  const formatUsedStorage = (kb: number | null | undefined) => {
    return formatStorageValue(kb, false);
  };

  const formatMaxStorageGB = (kb: number | null | undefined) => {
    return formatStorageValue(kb, true);
  };

  const calcStoragePercent = (
    usedKb: number | null | undefined,
    maxKb: number | null | undefined
  ) => {
    return calculateStoragePercent(usedKb, maxKb);
  };

  const formatTimeLeft = (deleteAt: string | Date | null) => {
    if (!deleteAt) return "-";
    const now = Date.now();
    const target = new Date(deleteAt).getTime();
    const diffMs = target - now;
    if (diffMs <= 0) return "Expired";
    const totalMinutes = Math.floor(diffMs / (60 * 1000));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleRestoreUser = async (userId: string) => {
    handleUserRestore(
      userId,
      restorableUsers,
      setUserToRestore,
      setRestoreConfirmationText,
      setShowRestoreConfirmation
    );
  };

  const restorablePaginatedUsers = useMemo(() => {
    const startIndex = (restorableCurrentPage - 1) * restorableItemsPerPage;
    const endIndex = startIndex + restorableItemsPerPage;
    return restorableUsers.slice(startIndex, endIndex);
  }, [restorableUsers, restorableCurrentPage]);

  const restorableTotalPages = Math.ceil(
    restorableUsers.length / restorableItemsPerPage
  );

  // Small helper to create a page range
  const paginationRange = (total: number) =>
    Array.from({ length: total }, (_, i) => i + 1);

  // Export helpers
  const buildExportRows = () => {
    const rows = usersList.map((u) => ({
      Name: u.name || "",
      Email: u.email,
      Phone: u.contactNumber || "",
      SIN: u.sinNumber || "",
      BusinessNumber: u.businessNumber || "",
      DOB: u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString() : "",
      Admin: u.isAdmin ? "Yes" : "No",
      Active: u.isActive ? "Yes" : "No",
      UploadedFiles: u.uploadedFiles ?? 0,
      AdminFiles: u.filesReceivedFromAdmin ?? 0,
      FormResponses: u.formResponses ?? 0,
      Joined: new Date(u.createdAt).toLocaleDateString(),
    }));
    return rows;
  };

  const toCSV = (rows: any[]) => {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const escape = (val: any) => {
      const s = String(val ?? "");
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return '"' + s.replaceAll('"', '""') + '"';
      }
      return s;
    };
    const lines = [headers.join(",")].concat(
      rows.map((r) => headers.map((h) => escape(r[h])).join(","))
    );
    return lines.join("\n");
  };

  const downloadBlob = (content: BlobPart, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = toCSV(buildExportRows());
    downloadBlob(csv, "users.csv", "text/csv;charset=utf-8;");
  };

  const handleExportExcel = () => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(rows);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Users");

    // Generate the XLSX file
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // Create blob and download
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success("Excel file exported successfully");
  };

  const handleExportCopy = async () => {
    const csv = toCSV(buildExportRows());
    try {
      await navigator.clipboard.writeText(csv);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleExportPDF = () => {
    const rows = buildExportRows();
    const headers = Object.keys(rows[0] || {});

    const createTableCell = (content: string): string => {
      return `<td style="border:1px solid #ddd;padding:6px;font-size:10px;">${content}</td>`;
    };

    const createTableRow = (cells: string[]): string => {
      const cellsHtml = cells.map((c) => createTableCell(c)).join("");
      return `<tr>${cellsHtml}</tr>`;
    };

    const tableRows = rows
      .map((r) =>
        headers.map((h) => String((r as Record<string, any>)[h] ?? ""))
      )
      .map((cells) => createTableRow(cells))
      .join("");
    const headerHtml = headers
      .map(
        (h) =>
          `<th style="border:1px solid #ddd;padding:6px;text-align:left;background:#f3f4f6;font-size:11px;">${h}</th>`
      )
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Users Export</title></head><body style="font-family:Arial,Helvetica,sans-serif;">
      <h3 style="margin:8px 0;">Users Export</h3>
      <table style="border-collapse:collapse;width:100%;">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <script>window.onload = () => { window.print(); }</script>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) {
      w.onload = () => {
        w.print();
        URL.revokeObjectURL(url);
      };
    } else {
      URL.revokeObjectURL(url);
    }
  };

  // Keep local usersList in sync with incoming users prop
  useEffect(() => {
    setUsersList(users);
  }, [users]);

  // Sync any pending activity data from localStorage on component mount
  useEffect(() => {
    syncPendingActivity();
  }, []);

  // Function to fetch online users
  const fetchOnlineUsers = () => fetchOnlineUsersData(setOnlineUsers);

  // Periodic function to mark offline users and refresh data
  useEffect(() => {
    const handleUpdateOnlineStatus = () =>
      updateOnlineStatus(() => markOfflineUsers(router), fetchOnlineUsers);

    // Update online status every 30 seconds
    const interval = setInterval(handleUpdateOnlineStatus, 30000);

    // Also run immediately
    handleUpdateOnlineStatus();

    return () => clearInterval(interval);
  }, [router]);

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = usersList;

    // Apply search filter
    if (searchQuery) {
      filtered = usersList.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.contactNumber?.includes(searchQuery) ||
          user.sinNumber?.includes(searchQuery) ||
          user.businessNumber?.includes(searchQuery)
      );
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "name":
            aValue = a.name || "";
            bValue = b.name || "";
            break;
          case "dob":
            aValue = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : 0;
            bValue = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : 0;
            break;
          case "joined":
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case "storage":
            aValue = a.storageUsed || 0;
            bValue = b.storageUsed || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [usersList, searchQuery, sortField, sortDirection]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAdminToggle = async (userId: string, currentIsAdmin: boolean) => {
    handleUserAdminToggle(
      userId,
      currentIsAdmin,
      users,
      setSelectedUser,
      setShowAdminModal
    );
  };

  const handleActiveToggle = async (
    userId: string,
    currentIsActive: boolean
  ) => {
    handleUserActiveToggle(
      userId,
      currentIsActive,
      users,
      setUserToToggleActive,
      setShowActiveToggleConfirmation
    );
  };

  const handleDeleteUserClick = (user: any) => {
    setUserToDelete({
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      uploadedFiles: user.uploadedFiles,
      filesReceivedFromAdmin: user.filesReceivedFromAdmin,
      formResponses: user.formResponses,
    });
    setShowDeleteConfirmation(true);
    setDeleteConfirmationText("");
  };

  const handleViewUserClick = (user: any) => {
    setViewUserId(user.id);
    setViewUserBasic(user);
    setShowViewModal(true);
  };

  const handleEditUserClick = (user: any) => {
    setEditUserId(user.id);
    setEditForm({
      name: user.name || "",
      contactNumber: user.contactNumber || "",
      occupation: user.occupation || "",
      sinNumber: user.sinNumber || "",
      businessNumber: user.businessNumber || "",
      dateOfBirth: formatDateForInput(user.dateOfBirth),
      address: user.address || "",
      sendBirthdayEmail: user.sendBirthdayEmail ?? true,
      maxStorageLimitValue: convertStorageKbToGb(user.maxStorageLimit),
      maxStorageUnit: "GB",
    });
    setShowEditModal(true);
  };

  const confirmActiveToggle = async () => {
    if (!userToToggleActive) return;

    await performActiveToggle(userToToggleActive, setUsersList, router, toast);

    setShowActiveToggleConfirmation(false);
    setUserToToggleActive(null);
    setActiveToggleConfirmationText("");
  };

  const confirmAdminToggle = async () => {
    if (!selectedUser) return;

    setTogglingAdmin(selectedUser.id);

    await performAdminToggle(selectedUser, setUsersList, router, toast);

    setTogglingAdmin(null);
    setShowAdminModal(false);
    setSelectedUser(null);
    setAdminToggleConfirmationText("");
  };

  // Use existing user data instead of separate API call
  useEffect(() => {
    if (!showViewModal || !viewUserId) return;
    setViewError(null);

    // Find the user from existing data
    const user = usersList.find((u) => u.id === viewUserId);
    if (user) {
      setViewData(generateMockFileData(user));
    } else {
      setViewError("User not found");
    }
  }, [showViewModal, viewUserId, usersList]);

  if (loading) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <Loader size={48} className="text-emerald-600 mb-3" />
          <div className="text-sm text-gray-600">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg">
        <div className="text-base font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full px-1 sm:px-2 lg:px-3 space-y-6">
      <Toaster
        position="top-center"
        theme="light"
        duration={1000}
        closeButton={false}
      />
      <Card className=" border-emerald-200 shadow-xl">
        <CardHeader className=" pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-xl text-gray-800">
                  User Management
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm">
                  View and manage all registered users ({users.length} total)
                  {onlineUsers.size > 0 && (
                    <span className="ml-2 text-green-600 font-medium">
                      • {onlineUsers.size} online now
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center md:items-center justify-end w-full space-x-1 sm:space-x-2 mr-4 mt-3 sm:mt-0 sm:ml-auto flex-nowrap whitespace-nowrap">
              <Button
                variant="outline"
                onClick={fetchUsers}
                disabled={loading}
                className="p-0 sm:px-3 sm:py-2 bg-white border-emerald-300 hover:bg-emerald-100 text-emerald-700 min-w-0 h-9 w-9 sm:h-auto sm:w-auto justify-center rounded-md"
                title="Refresh users"
              >
                <RefreshCw
                  className={`w-4 h-4 sm:mr-2 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="p-0 sm:px-3 sm:py-2 bg-white border-emerald-300 hover:bg-emerald-100 text-emerald-700 min-w-0 h-9 w-9 sm:h-auto sm:w-auto justify-center rounded-md"
                    title="Export users"
                  >
                    <Download className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={handleExportExcel}>
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCopy}>
                    Copy
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-0 sm:px-4 sm:py-2 rounded-md shadow-lg min-w-0 h-9 w-9 sm:h-auto sm:w-auto justify-center">
                    <UserPlus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Create User</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <CreateUserForm
                    onSuccess={async () => {
                      setIsCreateModalOpen(false);
                      await fetchUsers();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="mt-4 w-full">
            <div className="relative w-full overflow-hidden">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, occupation, phone, SIN, or business number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-full pl-10 py-2 text-sm border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200 rounded-lg"
              />
            </div>
          </div>
        </CardHeader>
        <div className="px-1 sm:px-2 lg:px-3 pb-4 ">
          <CardContent className="p-0 bg-emerald-50">
            <div className="bg-emerald-50 relative">
              <div className="max-h-[60vh] overflow-y-auto overflow-x-auto relative">
                <table className="w-full table-fixed">
                  <thead className="sticky top-0 z-20 bg-emerald-100 border-b border-emerald-200">
                    <tr className="border-emerald-200">
                      <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-16 text-center">
                        User
                      </th>
                      <th
                        className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-24 text-center cursor-pointer hover:bg-emerald-200 transition-colors"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Name</span>
                          <div className="flex flex-col">
                            <ChevronUp
                              className={`w-3 h-3 ${
                                sortField === "name" && sortDirection === "asc"
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <ChevronDown
                              className={`w-3 h-3 -mt-1 ${
                                sortField === "name" && sortDirection === "desc"
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            />
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-32 text-center">
                        Email
                      </th>
                      <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-20 text-center">
                        Phone
                      </th>
                      <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-24 text-center">
                        SIN
                      </th>
                      <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-28 text-center">
                        Business #
                      </th>
                      <th
                        className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-20 text-center cursor-pointer hover:bg-emerald-200 transition-colors"
                        onClick={() => handleSort("dob")}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>DOB</span>
                          <div className="flex flex-col">
                            <ChevronUp
                              className={`w-3 h-3 ${
                                sortField === "dob" && sortDirection === "asc"
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <ChevronDown
                              className={`w-3 h-3 -mt-1 ${
                                sortField === "dob" && sortDirection === "desc"
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            />
                          </div>
                        </div>
                      </th>
                      {/* <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-20 text-center">
                        Activity
                      </th> */}
                      <th
                        className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-32 text-center cursor-pointer hover:bg-emerald-200 transition-colors"
                        onClick={() => handleSort("storage")}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Storage</span>
                          <div className="flex flex-col">
                            <ChevronUp
                              className={`w-3 h-3 ${
                                sortField === "storage" &&
                                sortDirection === "asc"
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <ChevronDown
                              className={`w-3 h-3 -mt-1 ${
                                sortField === "storage" &&
                                sortDirection === "desc"
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            />
                          </div>
                        </div>
                      </th>
                      <th
                        className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-20 text-center cursor-pointer hover:bg-emerald-200 transition-colors"
                        onClick={() => handleSort("joined")}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Joined</span>
                          <div className="flex flex-col">
                            <ChevronUp
                              className={`w-3 h-3 ${
                                sortField === "joined" &&
                                sortDirection === "asc"
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <ChevronDown
                              className={`w-3 h-3 -mt-1 ${
                                sortField === "joined" &&
                                sortDirection === "desc"
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                              }`}
                            />
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-20 text-center">
                        Admin
                      </th>
                      <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-20 text-center">
                        Active
                      </th>
                      <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-20 text-center">
                        Status
                      </th>
                      <th className="py-3 px-2 text-emerald-800 font-bold bg-emerald-100 text-xs w-24 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={13}
                          className="py-8 text-center text-gray-500"
                        >
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <div className="text-base">No users found</div>
                          <div className="text-xs">
                            Try adjusting your search criteria
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <UsersTableRow
                          key={user.id}
                          user={user}
                          session={session}
                          onlineUsers={onlineUsers}
                          togglingAdmin={togglingAdmin}
                          getUserRowClassNameWithStorage={
                            getUserRowClassNameWithStorage
                          }
                          getAvatarRingClassNameWithStorage={
                            getAvatarRingClassNameWithStorage
                          }
                          getStatusBadgeClassNameWithStorage={
                            getStatusBadgeClassNameWithStorage
                          }
                          formatUsedStorage={formatUsedStorage}
                          formatMaxStorageGB={formatMaxStorageGB}
                          calcStoragePercent={calcStoragePercent}
                          renderStorageProgressBar={renderStorageProgressBar}
                          getProgressBarColor={getProgressBarColor}
                          copyToClipboard={copyToClipboard}
                          handleAdminToggle={handleAdminToggle}
                          handleActiveToggle={handleActiveToggle}
                          handleViewUserClick={handleViewUserClick}
                          handleEditUserClick={handleEditUserClick}
                          handleDeleteUserClick={handleDeleteUserClick}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Pagination */}
        {
          <div className="px-6 py-4 border-t border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
                {filteredUsers.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  {paginationRange(totalPages).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="px-3 py-1 text-xs"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        }
      </Card>

      {/* Restorable Users Table */}
      <Card className=" border-amber-200 shadow-xl">
        <CardHeader className=" pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg">
                <Trash2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  Scheduled for Deletion
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm">
                  Users that can be restored before permanent deletion
                </CardDescription>
              </div>
            </div>
            <div className="flex md:items-center justify-end w-full space-x-1 sm:space-x-2 mr-4 mt-3 sm:mt-0 sm:ml-auto flex-nowrap whitespace-nowrap">
              <Button
                variant="outline"
                onClick={fetchRestorableUsers}
                disabled={restorableLoading}
                className="p-0 sm:px-3 sm:py-2 bg-white border-amber-300 hover:bg-amber-100 text-amber-700 min-w-0 h-9 w-9 sm:h-auto sm:w-auto justify-center rounded-md"
                title="Refresh restorable users"
              >
                <RefreshCw
                  className={`w-4 h-4 sm:mr-2 ${restorableLoading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <div className="px-1 sm:px-2 lg:px-3 pb-4 ">
          <CardContent className="p-0 bg-amber-50">
            <div className="bg-amber-50 relative">
              <div className="max-h-[40vh] overflow-y-auto overflow-x-auto relative">
                {restorableError ? (
                  <div className="py-6 text-center text-red-600">
                    {restorableError}
                  </div>
                ) : (
                  <div className="min-w-full">
                    <table className="w-full table-fixed">
                      <thead className="sticky top-0 z-20 bg-amber-100 border-b border-amber-200">
                        <tr className="border-amber-200">
                          <th className="py-3 px-2 text-amber-800 font-bold bg-amber-100 text-xs w-24 text-left">
                            Name
                          </th>
                          <th className="py-3 px-2 text-amber-800 font-bold bg-amber-100 text-xs w-32 text-left">
                            Email
                          </th>
                          <th className="py-3 px-2 text-amber-800 font-bold bg-amber-100 text-xs w-24 text-left">
                            Phone
                          </th>
                          <th className="py-3 px-2 text-amber-800 font-bold bg-amber-100 text-xs w-24 text-left">
                            SIN
                          </th>
                          <th className="py-3 px-2 text-amber-800 font-bold bg-amber-100 text-xs w-28 text-left">
                            Business #
                          </th>
                          <th className="py-3 px-2 text-amber-800 font-bold bg-amber-100 text-xs w-24 text-left">
                            Joined
                          </th>
                          <th className="py-3 px-2 text-amber-800 font-bold bg-amber-100 text-xs w-32 text-left">
                            Deleted When
                          </th>
                          <th className="py-3 px-2 text-amber-800 font-bold bg-amber-100 text-xs w-24 text-left">
                            Time Left
                          </th>
                          <th className="py-3 px-2 text-amber-800 font-bold bg-amber-100 text-xs w-24 text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {restorableLoading ? (
                          <tr>
                            <td colSpan={9}>
                              <div className="w-full py-10 flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                  <Loader
                                    size={36}
                                    className="text-amber-600 mb-2"
                                  />
                                  <div className="text-sm text-amber-700">
                                    Loading restorable users...
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          renderRestorableUsersRows(
                            restorableUsers,
                            restorablePaginatedUsers,
                            restoringUserId,
                            handleRestoreUser,
                            formatTimeLeft
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </div>
        {/* Restorable Pagination */}
        <div className="px-6 py-4 border-t border-amber-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(restorableCurrentPage - 1) * restorableItemsPerPage + 1}{" "}
              to{" "}
              {Math.min(
                restorableCurrentPage * restorableItemsPerPage,
                restorableUsers.length
              )}{" "}
              of {restorableUsers.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setRestorableCurrentPage(restorableCurrentPage - 1)
                }
                disabled={restorableCurrentPage === 1}
                className="px-3 py-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-1">
                {paginationRange(restorableTotalPages).map((page) => (
                  <Button
                    key={page}
                    variant={
                      restorableCurrentPage === page ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setRestorableCurrentPage(page)}
                    className="px-3 py-1 text-xs"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setRestorableCurrentPage(restorableCurrentPage + 1)
                }
                disabled={restorableCurrentPage === restorableTotalPages}
                className="px-3 py-1"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <UserManagementModals
        showRestoreConfirmation={showRestoreConfirmation}
        setShowRestoreConfirmation={setShowRestoreConfirmation}
        userToRestore={userToRestore}
        setUserToRestore={setUserToRestore}
        restoreConfirmationText={restoreConfirmationText}
        setRestoreConfirmationText={setRestoreConfirmationText}
        restoringUserId={restoringUserId}
        setRestoringUserId={setRestoringUserId}
        fetchUsers={fetchUsers}
        fetchRestorableUsers={fetchRestorableUsers}
        showDeleteConfirmation={showDeleteConfirmation}
        setShowDeleteConfirmation={setShowDeleteConfirmation}
        userToDelete={userToDelete}
        setUserToDelete={setUserToDelete}
        deleteConfirmationText={deleteConfirmationText}
        setDeleteConfirmationText={setDeleteConfirmationText}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        showAdminModal={showAdminModal}
        setShowAdminModal={setShowAdminModal}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        adminToggleConfirmationText={adminToggleConfirmationText}
        setAdminToggleConfirmationText={setAdminToggleConfirmationText}
        togglingAdmin={togglingAdmin}
        confirmAdminToggle={confirmAdminToggle}
        showActiveToggleConfirmation={showActiveToggleConfirmation}
        setShowActiveToggleConfirmation={setShowActiveToggleConfirmation}
        userToToggleActive={userToToggleActive}
        setUserToToggleActive={setUserToToggleActive}
        activeToggleConfirmationText={activeToggleConfirmationText}
        setActiveToggleConfirmationText={setActiveToggleConfirmationText}
        confirmActiveToggle={confirmActiveToggle}
        showViewModal={showViewModal}
        setShowViewModal={setShowViewModal}
        viewError={viewError}
        viewData={viewData}
        viewUserBasic={viewUserBasic}
        formatUsedStorage={formatUsedStorage}
        formatMaxStorageGB={formatMaxStorageGB}
        calcStoragePercent={calcStoragePercent}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        editUserId={editUserId}
        editLoading={editLoading}
        setEditLoading={setEditLoading}
        editForm={editForm}
        setEditForm={setEditForm}
        setUsersList={setUsersList}
        router={router}
      />
    </div>
  );
}
