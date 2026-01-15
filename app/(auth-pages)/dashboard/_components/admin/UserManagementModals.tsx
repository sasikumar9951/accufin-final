"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { Switch } from "@/components/ui/switch";
import { Shield, User, Eye } from "lucide-react";
import { toast } from "sonner";
import { RestoreUserModal } from "./RestoreUserModal";
import { DeleteUserModal } from "./DeleteUserModal";

type StorageValue = number | null | undefined;

interface ViewModalContentProps {
  viewError: string | null;
  viewData: any;
  viewUserBasic: any;
  formatUsedStorage: (kb: StorageValue) => string;
  formatMaxStorageGB: (kb: StorageValue) => string;
  calcStoragePercent: (usedKb: StorageValue, maxKb: StorageValue) => number;
}

function ViewModalContent({
  viewError,
  viewData,
  viewUserBasic,
  formatUsedStorage,
  formatMaxStorageGB,
  calcStoragePercent,
}: Readonly<ViewModalContentProps>) {
  if (viewError) {
    return <div className="py-4 text-red-600">{viewError}</div>;
  }

  if (!viewData) {
    return <div className="py-4 text-gray-600">No data available.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500">Name</div>
          <div className="text-sm font-medium text-gray-900">
            {viewUserBasic?.name || ""}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Email</div>
          <div className="flex items-center space-x-2">
            {viewUserBasic?.email ? (
              <button
                type="button"
                className="text-sm font-medium text-emerald-700 break-all max-w-xs hover:text-emerald-800 hover:underline py-1 rounded transition-colors bg-transparent border-none cursor-pointer"
                title="Click to copy email"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(viewUserBasic.email);
                    toast.success("Email copied!");
                  } catch {
                    toast.error("Failed to copy email");
                  }
                }}
              >
                {viewUserBasic.email}
              </button>
            ) : (
              <span className="text-sm font-medium text-gray-400">
                No email
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Status</div>
          <div
            className={`text-sm font-semibold ${
              viewUserBasic?.isActive ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {viewUserBasic?.isActive ? "Active" : "Inactive"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Phone</div>
          <div className="flex items-center space-x-2">
            {viewUserBasic?.contactNumber ? (
              <button
                type="button"
                className="text-sm font-medium text-gray-900 hover:text-emerald-800 hover:underline py-1 rounded transition-colors bg-transparent border-none cursor-pointer"
                title="Click to copy phone number"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      viewUserBasic.contactNumber || ""
                    );
                    toast.success("Phone number copied!");
                  } catch {
                    toast.error("Failed to copy phone number");
                  }
                }}
              >
                {viewUserBasic.contactNumber}
              </button>
            ) : (
              <span className="text-sm font-medium text-gray-400">
                No phone number
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Occupation</div>
          <div className="text-sm font-medium text-gray-900">
            {viewUserBasic?.occupation || ""}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">SIN</div>
          <div className="text-sm font-medium text-gray-900">
            {viewUserBasic?.sinNumber || ""}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Business Number</div>
          <div className="text-sm font-medium text-gray-900">
            {viewUserBasic?.businessNumber || ""}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Date of Birth</div>
          <div className="text-sm font-medium text-gray-900">
            {viewUserBasic?.dateOfBirth
              ? new Date(viewUserBasic.dateOfBirth).toLocaleDateString()
              : ""}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Joined</div>
          <div className="text-sm font-medium text-gray-900">
            {viewUserBasic?.createdAt
              ? new Date(viewUserBasic.createdAt).toLocaleDateString()
              : ""}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Storage</div>
          <div className="text-sm font-medium text-gray-900">
            {formatUsedStorage(viewUserBasic?.storageUsed)} /{" "}
            {formatMaxStorageGB(viewUserBasic?.maxStorageLimit)}
            <span className="ml-2 text-xs text-gray-500">
              {calcStoragePercent(
                viewUserBasic?.storageUsed,
                viewUserBasic?.maxStorageLimit
              )}
              %
            </span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Birthday Emails</div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                viewUserBasic?.sendBirthdayEmail ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                viewUserBasic?.sendBirthdayEmail
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {viewUserBasic?.sendBirthdayEmail ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="text-xs text-emerald-700">Uploaded Files</div>
          <div className="text-lg font-semibold text-emerald-800">
            {viewUserBasic?.uploadedFiles ?? 0}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="text-xs text-emerald-700">Admin Files</div>
          <div className="text-lg font-semibold text-emerald-800">
            {viewUserBasic?.filesReceivedFromAdmin ?? 0}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="text-xs text-emerald-700">Form Responses</div>
          <div className="text-lg font-semibold text-emerald-800">
            {viewUserBasic?.formResponses ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions to reduce cognitive complexity
async function restoreUserAPI(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}/restore`, {
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to restore user");
  return data;
}

async function deleteUserAPI(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}/soft-delete`, {
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error || "Failed to mark user for deletion");
  return data;
}

async function updateUserAPI(userId: string, payload: any) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update user");
  return data;
}

function convertToKB(value: number, unit: "KB" | "MB" | "GB"): number {
  if (unit === "KB") return value;
  if (unit === "MB") return value * 1024;
  return value * 1024 * 1024;
}

interface UserManagementModalsProps {
  // Restore Modal
  showRestoreConfirmation: boolean;
  setShowRestoreConfirmation: (show: boolean) => void;
  userToRestore: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  setUserToRestore: (user: any) => void;
  restoreConfirmationText: string;
  setRestoreConfirmationText: (text: string) => void;
  restoringUserId: string | null;
  setRestoringUserId: (id: string | null) => void;
  fetchUsers: () => Promise<void>;
  fetchRestorableUsers: () => Promise<void>;

  // Delete Modal
  showDeleteConfirmation: boolean;
  setShowDeleteConfirmation: (show: boolean) => void;
  userToDelete: {
    id: string;
    name: string;
    email: string;
    uploadedFiles: number;
    filesReceivedFromAdmin: number;
    formResponses: number;
  } | null;
  setUserToDelete: (user: any) => void;
  deleteConfirmationText: string;
  setDeleteConfirmationText: (text: string) => void;
  isDeleting: boolean;
  setIsDeleting: (deleting: boolean) => void;

  // Admin Toggle Modal
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  selectedUser: { id: string; name: string; isAdmin: boolean } | null;
  setSelectedUser: (user: any) => void;
  adminToggleConfirmationText: string;
  setAdminToggleConfirmationText: (text: string) => void;
  togglingAdmin: string | null;
  confirmAdminToggle: () => Promise<void>;

  // Active Toggle Modal
  showActiveToggleConfirmation: boolean;
  setShowActiveToggleConfirmation: (show: boolean) => void;
  userToToggleActive: {
    id: string;
    name: string;
    currentStatus: boolean;
  } | null;
  setUserToToggleActive: (user: any) => void;
  activeToggleConfirmationText: string;
  setActiveToggleConfirmationText: (text: string) => void;
  confirmActiveToggle: () => Promise<void>;

  // View Modal
  showViewModal: boolean;
  setShowViewModal: (show: boolean) => void;
  viewError: string | null;
  viewData: any;
  viewUserBasic: any;
  formatUsedStorage: (kb: StorageValue) => string;
  formatMaxStorageGB: (kb: StorageValue) => string;
  calcStoragePercent: (usedKb: StorageValue, maxKb: StorageValue) => number;

  // Edit Modal
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  editUserId: string | null;
  editLoading: boolean;
  setEditLoading: (loading: boolean) => void;
  editForm: {
    name: string;
    contactNumber: string;
    occupation: string;
    sinNumber: string;
    businessNumber: string;
    dateOfBirth: string;
    address: string;
    sendBirthdayEmail: boolean;
    maxStorageLimitValue: number;
    maxStorageUnit: "KB" | "MB" | "GB";
  };
  setEditForm: any;
  setUsersList: any;
  router: any;
}

export default function UserManagementModals(
  props: Readonly<UserManagementModalsProps>
) {
  const {
    showRestoreConfirmation,
    setShowRestoreConfirmation,
    userToRestore,
    setUserToRestore,
    restoreConfirmationText,
    setRestoreConfirmationText,
    restoringUserId,
    setRestoringUserId,
    fetchUsers,
    fetchRestorableUsers,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    userToDelete,
    setUserToDelete,
    deleteConfirmationText,
    setDeleteConfirmationText,
    isDeleting,
    setIsDeleting,
    showAdminModal,
    setShowAdminModal,
    selectedUser,
    setSelectedUser,
    adminToggleConfirmationText,
    setAdminToggleConfirmationText,
    togglingAdmin,
    confirmAdminToggle,
    showActiveToggleConfirmation,
    setShowActiveToggleConfirmation,
    userToToggleActive,
    setUserToToggleActive,
    activeToggleConfirmationText,
    setActiveToggleConfirmationText,
    confirmActiveToggle,
    showViewModal,
    setShowViewModal,
    viewError,
    viewData,
    viewUserBasic,
    formatUsedStorage,
    formatMaxStorageGB,
    calcStoragePercent,
    showEditModal,
    setShowEditModal,
    editUserId,
    editLoading,
    setEditLoading,
    editForm,
    setEditForm,
    setUsersList,
    router,
  } = props;

  const handleRestoreUser = async () => {
    if (!userToRestore || restoreConfirmationText !== "CONFIRM") return;

    setRestoringUserId(userToRestore.id);
    try {
      await restoreUserAPI(userToRestore.id);
      toast.success("User restored successfully");
      await Promise.all([fetchUsers(), fetchRestorableUsers()]);
      setShowRestoreConfirmation(false);
      setUserToRestore(null);
      setRestoreConfirmationText("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to restore user");
    } finally {
      setRestoringUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || deleteConfirmationText !== "CONFIRM") return;

    setIsDeleting(true);
    try {
      await deleteUserAPI(userToDelete.id);
      toast.success("User scheduled for deletion in 24 hours");
      await Promise.all([fetchUsers(), fetchRestorableUsers()]);
      setShowDeleteConfirmation(false);
      setUserToDelete(null);
      setDeleteConfirmationText("");
    } catch (e: any) {
      if (e?.message) toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editUserId) return;

    setEditLoading(true);
    try {
      const utcDob = editForm.dateOfBirth
        ? (() => {
            const [yearStr, monthStr, dayStr] = editForm.dateOfBirth.split("-");
            const year = Number(yearStr);
            const month = Number(monthStr);
            const day = Number(dayStr);
            return new Date(
              Date.UTC(year, (month || 1) - 1, day || 1)
            ).toISOString();
          })()
        : null;

      const payload = {
        ...editForm,
        dateOfBirth: utcDob,
        maxStorageLimit: Math.max(
          0,
          Math.floor(
            convertToKB(
              Number(editForm.maxStorageLimitValue) || 0,
              editForm.maxStorageUnit || "GB"
            )
          )
        ),
      };

      const data = await updateUserAPI(editUserId, payload);
      setUsersList((prev: any) =>
        prev.map((u: any) => (u.id === editUserId ? { ...u, ...data } : u))
      );
      toast.success("User updated successfully");
      setShowEditModal(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      {/* Restore Confirmation Modal */}
      <RestoreUserModal
        showRestoreConfirmation={showRestoreConfirmation}
        setShowRestoreConfirmation={setShowRestoreConfirmation}
        userToRestore={userToRestore}
        setUserToRestore={setUserToRestore}
        restoreConfirmationText={restoreConfirmationText}
        setRestoreConfirmationText={setRestoreConfirmationText}
        restoringUserId={restoringUserId}
        handleRestoreUser={handleRestoreUser}
      />

      {/* Enhanced Delete confirmation dialog */}
      <DeleteUserModal
        showDeleteConfirmation={showDeleteConfirmation}
        setShowDeleteConfirmation={setShowDeleteConfirmation}
        userToDelete={userToDelete}
        setUserToDelete={setUserToDelete}
        deleteConfirmationText={deleteConfirmationText}
        setDeleteConfirmationText={setDeleteConfirmationText}
        isDeleting={isDeleting}
        handleDeleteUser={handleDeleteUser}
      />

      {/* Admin Toggle Confirmation Modal */}
      <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <span>Confirm Admin Status Change</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to{" "}
              {selectedUser?.isAdmin
                ? "remove admin privileges from"
                : "grant admin privileges to"}{" "}
              <span className="font-semibold">{selectedUser?.name}</span>?
            </p>
            {selectedUser?.isAdmin ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-amber-800 text-sm">
                  <strong>Warning:</strong> This will remove admin access from
                  the user. They will no longer be able to access admin
                  features.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                <p className="text-emerald-800 text-sm">
                  <strong>Note:</strong> This will grant full admin access to
                  the user. They will be able to manage other users and access
                  all admin features.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label
                htmlFor="admin-toggle-confirm"
                className="text-sm font-medium text-gray-700"
              >
                To confirm this action, type <strong>"CONFIRM"</strong> in the
                box below:
              </label>
              <input
                id="admin-toggle-confirm"
                type="text"
                value={adminToggleConfirmationText}
                onChange={(e) => setAdminToggleConfirmationText(e.target.value)}
                placeholder="Type CONFIRM to proceed"
                className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-200"
                disabled={togglingAdmin !== null}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={confirmAdminToggle}
              disabled={
                togglingAdmin !== null ||
                adminToggleConfirmationText !== "CONFIRM"
              }
              className={
                selectedUser?.isAdmin
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {togglingAdmin ? (
                <>
                  <Loader size={16} className="mr-2" />
                  Updating...
                </>
              ) : (
                <>{selectedUser?.isAdmin ? "Remove Admin" : "Make Admin"}</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdminModal(false);
                setSelectedUser(null);
                setAdminToggleConfirmationText("");
              }}
              disabled={togglingAdmin !== null}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Toggle Confirmation Modal */}
      <Dialog
        open={showActiveToggleConfirmation}
        onOpenChange={setShowActiveToggleConfirmation}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-emerald-600" />
              <span>Confirm User Status Change</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to{" "}
              {userToToggleActive?.currentStatus ? "deactivate" : "activate"}{" "}
              <span className="font-semibold">{userToToggleActive?.name}</span>?
            </p>
            {userToToggleActive?.currentStatus ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> This will deactivate the user
                  account. They will no longer be able to log in or access the
                  system.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                <p className="text-emerald-800 text-sm">
                  <strong>Note:</strong> This will activate the user account.
                  They will be able to log in and access the system normally.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label
                htmlFor="active-toggle-confirm"
                className="text-sm font-medium text-gray-700"
              >
                To confirm this action, type <strong>"CONFIRM"</strong> in the
                box below:
              </label>
              <input
                id="active-toggle-confirm"
                type="text"
                value={activeToggleConfirmationText}
                onChange={(e) =>
                  setActiveToggleConfirmationText(e.target.value)
                }
                placeholder="Type CONFIRM to proceed"
                className="w-full border border-emerald-300 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-200"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={confirmActiveToggle}
              disabled={activeToggleConfirmationText !== "CONFIRM"}
              className={
                userToToggleActive?.currentStatus
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {userToToggleActive?.currentStatus
                ? "Deactivate User"
                : "Activate User"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowActiveToggleConfirmation(false);
                setUserToToggleActive(null);
                setActiveToggleConfirmationText("");
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="w-[95vw] sm:w-auto max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              <span>User Details</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <ViewModalContent
              viewError={viewError}
              viewData={viewData}
              viewUserBasic={viewUserBasic}
              formatUsedStorage={formatUsedStorage}
              formatMaxStorageGB={formatMaxStorageGB}
              calcStoragePercent={calcStoragePercent}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="default"
              onClick={() => setShowViewModal(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Name</div>
                <input
                  className="w-full border border-emerald-200 rounded-md px-2 py-1 text-sm bg-white"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p: any) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Phone</div>
                <input
                  className="w-full border border-emerald-200 rounded-md px-2 py-1 text-sm bg-white"
                  value={editForm.contactNumber}
                  onChange={(e) =>
                    setEditForm((p: any) => ({
                      ...p,
                      contactNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Occupation</div>
                <input
                  className="w-full border border-emerald-200 rounded-md px-2 py-1 text-sm bg-white"
                  value={editForm.occupation}
                  onChange={(e) =>
                    setEditForm((p: any) => ({
                      ...p,
                      occupation: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">SIN</div>
                <input
                  className="w-full border border-emerald-200 rounded-md px-2 py-1 text-sm bg-white"
                  value={editForm.sinNumber}
                  onChange={(e) =>
                    setEditForm((p: any) => ({
                      ...p,
                      sinNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">
                  Business Number
                </div>
                <input
                  className="w-full border border-emerald-200 rounded-md px-2 py-1 text-sm bg-white"
                  value={editForm.businessNumber}
                  onChange={(e) =>
                    setEditForm((p: any) => ({
                      ...p,
                      businessNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Date of Birth</div>
                <input
                  type="date"
                  className="w-full border border-emerald-200 rounded-md px-2 py-1 text-sm bg-white"
                  value={editForm.dateOfBirth}
                  onChange={(e) =>
                    setEditForm((p: any) => ({
                      ...p,
                      dateOfBirth: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-600 mb-1">Address</div>
                <input
                  className="w-full border border-emerald-200 rounded-md px-2 py-1 text-sm bg-white"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((p: any) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editForm.sendBirthdayEmail}
                    onCheckedChange={(checked) =>
                      setEditForm((p: any) => ({
                        ...p,
                        sendBirthdayEmail: checked,
                      }))
                    }
                  />
                  <div>
                    <div className="text-xs text-gray-600">
                      Send Birthday Emails
                    </div>
                    <div className="text-xs text-gray-500">
                      Receive birthday email notifications
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">
                  Max Storage (in GB)
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-emerald-200 rounded-md px-2 py-1 text-sm bg-white appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={Number(editForm.maxStorageLimitValue) || 0}
                    onChange={(e) =>
                      setEditForm((p: any) => ({
                        ...p,
                        maxStorageLimitValue: Number(e.target.value || 0),
                      }))
                    }
                    placeholder="e.g., 1"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={editLoading}
              onClick={handleEditUser}
            >
              {editLoading ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
