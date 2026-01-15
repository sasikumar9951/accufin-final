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
  FormInput,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  FileText,
  AlertCircle,
  Calendar,
  BarChart3,
  Users,
  Search,
  User,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/client-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Form {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isCompulsory: boolean;
  createdAt: string;
  updatedAt: string;
  fieldsCount: number;
  responsesCount: number;
  assignedUsersCount: number;
  assignedUsers: {
    id: string;
    name: string | null;
    email: string;
  }[];
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function FormsManagement() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingCompulsoryId, setTogglingCompulsoryId] = useState<
    string | null
  >(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [updatingUsers, setUpdatingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const [usersLoading, setUsersLoading] = useState(false);
  // Fetch forms and users
  useEffect(() => {
    fetchForms();
    fetchUsers();
  }, []);

  // Filter users based on search query and prioritize selected users
  useEffect(() => {
    let filtered = users;
    if (searchQuery.trim() !== "") {
      filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    const sorted = [...filtered].sort((a, b) => {
      const aSelected = selectedUserIds.includes(a.id);
      const bSelected = selectedUserIds.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
    setFilteredUsers(sorted);
  }, [users, searchQuery, selectedUserIds]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/admin/forms", { logoutOn401: false });
      if (!response.ok) {
        throw new Error("Failed to fetch forms");
      }
      const data = await response.json();
      setForms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await apiFetch("/api/admin/get-assignable-users", { logoutOn401: false });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDelete = async (formId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this form? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingId(formId);
      const response = await apiFetch(`/api/admin/forms?id=${formId}`, { method: "DELETE", logoutOn401: false });

      if (!response.ok) {
        throw new Error("Failed to delete form");
      }

      toast.success("Form deleted successfully!");
      await fetchForms(); // Refresh forms list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete form");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (formId: string, currentStatus: boolean) => {
    try {
      setTogglingId(formId);
      const response = await apiFetch("/api/admin/forms/toggle", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: formId, isActive: !currentStatus }), logoutOn401: false });

      if (!response.ok) {
        throw new Error("Failed to toggle form status");
      }

      toast.success(
        `Form ${currentStatus ? "deactivated" : "activated"} successfully!`
      );
      await fetchForms(); // Refresh forms list
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle form status"
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleCompulsory = async (
    formId: string,
    currentStatus: boolean
  ) => {
    try {
      setTogglingCompulsoryId(formId);
      const response = await apiFetch("/api/admin/forms/toggle-compulsory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: formId, isCompulsory: !currentStatus }), logoutOn401: false });

      if (!response.ok) {
        throw new Error("Failed to toggle form compulsory status");
      }

      toast.success(
        `Form marked as ${
          currentStatus ? "optional" : "compulsory"
        } successfully!`
      );
      await fetchForms(); // Refresh forms list
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to toggle compulsory status"
      );
    } finally {
      setTogglingCompulsoryId(null);
    }
  };

  const handleOpenUserModal = (formId: string, currentUserIds: string[]) => {
    setSelectedFormId(formId);
    setSelectedUserIds(currentUserIds);
    setSearchQuery("");
    setIsUserModalOpen(true);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds([...selectedUserIds, userId]);
  };

  const handleUserDeselect = (userId: string) => {
    setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
  };



  const handleUpdateAssignedUsers = async () => {
    if (!selectedFormId) return;

    try {
      setUpdatingUsers(true);
      const response = await fetch(
        `/api/admin/forms/${selectedFormId}/assign-users`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userIds: selectedUserIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update assigned users");
      }

      toast.success("Assigned users updated successfully!");
      await fetchForms(); // Refresh forms list
      setIsUserModalOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update assigned users"
      );
    } finally {
      setUpdatingUsers(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-gray-600">
          <Loader size={48} className="mb-2 text-green-600" />
          Loading forms...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FormInput className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Form Management</CardTitle>
                <CardDescription>
                  Create and manage forms for data collection
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <FormInput className="w-16 h-16 mx-auto mb-4 text-gray-300 opacity-20" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Forms Yet
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first form
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {forms.map((form) => (
                <Card
                  key={form.id}
                  className="hover:shadow-lg transition-shadow duration-200"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between overflow-hidden">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge
                            variant={form.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {form.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {form.isCompulsory && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl leading-tight break-all">
                          {form.title}
                        </CardTitle>
                        {form.description && (
                          <CardDescription className="mt-2 text-base break-all">
                            {form.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <FormInput className="w-4 h-4" />
                          <span>{form.fieldsCount} fields</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <BarChart3 className="w-4 h-4" />
                          <span>{form.responsesCount} responses</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>
                            {form.assignedUsersCount} assigned user
                            {form.assignedUsersCount === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Created{" "}
                            {new Date(form.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/form/edit/${form.id}`)
                          }
                          className="flex items-center space-x-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/form/responses/${form.id}`)
                          }
                          className="flex items-center space-x-1"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Responses</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleActive(form.id, form.isActive)
                          }
                          disabled={togglingId === form.id}
                          className="flex items-center space-x-1"
                        >
                          {form.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          <span>
                            {form.isActive ? "Deactivate" : "Activate"}
                          </span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleCompulsory(form.id, form.isCompulsory)
                          }
                          disabled={togglingCompulsoryId === form.id}
                          className="flex items-center space-x-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            {form.isCompulsory ? "Optional" : "Required"}
                          </span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleOpenUserModal(
                              form.id,
                              form.assignedUsers.map((user) => user.id)
                            )
                          }
                          className="flex items-center space-x-1"
                        >
                          <Users className="w-4 h-4" />
                          <span>Assign Users</span>
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(form.id)}
                          disabled={deletingId === form.id}
                          className="flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Add Form Button - top right (old style) */}
      <Button
        onClick={() => router.push("/dashboard/form/add")}
        aria-label="Add Form"
        className="fixed top-24 left-6 z-30 flex items-center space-x-2 shadow-lg bg-[#007399]"
      >
        <Plus className="w-4 h-4" />
        <span>Add Form</span>
      </Button>

      {/* User Assignment Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] h-full bg-white flex flex-col overflow-y-scroll overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Assign Users to Form
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Users Count */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {selectedUserIds.length} user
                {selectedUserIds.length === 1 ? "" : "s"} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserIds([])}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>

            {/* User List */}
            <div className="border rounded-lg overflow-x-hidden overflow-scroll">
              {usersLoading && (
                <div className="p-8 flex flex-col items-center justify-center text-gray-500">
                  <Loader size={32} className="mb-2 text-blue-500" />
                  <p>Loading users...</p>
                </div>
              )}
              
              {!usersLoading && filteredUsers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No users found</p>
                </div>
              )}
              
              {!usersLoading && filteredUsers.length > 0 && (
                <div className="divide-y">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          handleUserDeselect(user.id);
                        } else {
                          handleUserSelect(user.id);
                        }
                      }}
                      className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleUserSelect(user.id);
                          } else {
                            handleUserDeselect(user.id);
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <Label
                            htmlFor={`user-${user.id}`}
                            className="font-medium text-gray-900 cursor-pointer"
                          >
                            {user.name || "No name"}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500 truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAssignedUsers}
              disabled={updatingUsers}
              className="min-w-20"
            >
              {updatingUsers ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
