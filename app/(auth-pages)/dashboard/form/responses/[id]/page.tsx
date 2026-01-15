"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";
import DashboardHeader from "../../../_components/admin/DashboardHeader";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FormResponse {
  id: string;
  isChecked: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  answers: {
    id: string;
    fieldId: string;
    fieldType: string;
    value: string;
    rowId?: string;
    columnId?: string;
  }[];
}

interface FormData {
  id: string;
  title: string;
  description: string | null;
  fieldLabels: Record<string, string>;
  responses: FormResponse[];
}

export default function FormResponsesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (!session.user?.isAdmin) {
      router.push("/404");
      return;
    }

    fetchFormResponses();
  }, [session, status, router, params.id]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    router.push("/login");
  };

  const handleTabChange = (tab: string) => {
    // Navigate to the specific dashboard tab with URL parameter
    if (tab === "forms") {
      router.push("/dashboard?tab=forms");
    } else {
      router.push(`/dashboard?tab=${tab}`);
    }
  };

  const fetchFormResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/forms/${params.id}/responses`);
      if (!response.ok) {
        throw new Error("Failed to fetch form responses");
      }
      const data = await response.json();
      setFormData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load responses");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchFormResponses();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    try {
      setDeletingId(responseId);
      const res = await fetch(`/api/admin/forms/responses/${responseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as any);
        throw new Error(data?.error || "Failed to delete response");
      }
      if (selectedResponse?.id === responseId) {
        setSelectedResponse(null);
      }
      await fetchFormResponses();
    } catch (e: any) {
      alert(e?.message || "Failed to delete response");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-cyan-50 pt-24">
        <DashboardHeader
          activeTab="forms"
          onTabChange={handleTabChange}
          onLogout={handleLogout}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Form Responses Content */}
          <div className="bg-white shadow-sm border rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                  Form Responses
                </h1>
                <button
                  onClick={() => router.push("/dashboard?tab=forms")}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  ← Back to Forms
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center">
                  <Loader size={32} className="mb-3 text-blue-500" />
                  <p className="text-gray-600">Loading responses...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Page not found</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cyan-50 pt-24">
        <DashboardHeader
          activeTab="forms"
          onTabChange={handleTabChange}
          onLogout={handleLogout}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Form Responses Content */}
          <div className="bg-white shadow-sm border rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                  Form Responses
                </h1>
                <button
                  onClick={() => router.push("/dashboard?tab=forms")}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  ← Back to Forms
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-red-500">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyan-50 pt-24 overflow-x-hidden">
      <DashboardHeader
        activeTab="forms"
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => router.push("/dashboard?tab=forms")}
          aria-label="Back to Forms"
          className="fixed top-23 left-6 z-30 inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors shadow-sm"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Forms
        </button>

        {/* Form Responses Content */}
        <div className="bg-white shadow-sm border rounded-lg mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">
                Form Responses
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-60"
                >
                  <RefreshCw className="w-4 h-4" />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Form Info */}
              <Card>
                <CardHeader className="overflow-hidden">
                  <CardTitle className="break-all">{formData?.title || "Form"}</CardTitle>
                  {formData?.description && (
                    <CardDescription className="break-all">{formData.description}</CardDescription>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span>
                      {formData?.responses?.length || 0} total responses
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      {formData?.responses?.filter((r) => r.isChecked).length ||
                        0}{" "}
                      with permission granted
                    </span>
                  </div>
                </CardHeader>
              </Card>

              {/* Responses Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Responses</CardTitle>
                  <CardDescription>
                    View all form submissions and their privacy consent status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!formData?.responses || formData.responses.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 opacity-20" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Responses Yet
                      </h3>
                      <p className="text-gray-500">
                        This form hasn't received any submissions yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Respondent</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Submitted At</TableHead>
                            <TableHead>Privacy Consent</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.responses.map((response) => (
                            <TableRow key={response.id}>
                              <TableCell className="font-medium">
                                {response.user.name || "Anonymous"}
                              </TableCell>
                              <TableCell>{response.user.email}</TableCell>
                              <TableCell>
                                {new Date(response.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    response.isChecked
                                      ? "default"
                                      : "destructive"
                                  }
                                  className="flex items-center space-x-1 w-fit"
                                >
                                  {response.isChecked ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Granted</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3" />
                                      <span>Denied</span>
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/form/view/${response.id}`
                                      )
                                    }
                                    className="flex items-center space-x-1"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>View/Edit</span>
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={deletingId === response.id}
                                    className="flex items-center space-x-1"
                                  >
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <div className="flex items-center">
                                          <Trash2 className="w-4 h-4" />
                                          <span className="ml-1">
                                            {deletingId === response.id
                                              ? "Deleting..."
                                              : "Delete"}
                                          </span>
                                        </div>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete this response?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete the
                                            response and all of its answers.
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDeleteResponse(response.id)
                                            }
                                            disabled={
                                              deletingId === response.id
                                            }
                                          >
                                            {deletingId === response.id
                                              ? "Deleting..."
                                              : "Delete"}
                                          </AlertDialogAction>
                                          <AlertDialogCancel
                                            disabled={
                                              deletingId === response.id
                                            }
                                          >
                                            Cancel
                                          </AlertDialogCancel>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setSelectedResponse(response)
                                        }
                                        className="flex items-center space-x-1"
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span>Quick View</span>
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Response Details
                                        </DialogTitle>
                                      </DialogHeader>
                                      {selectedResponse && (
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div>
                                              <span className="text-sm font-medium text-gray-600">
                                                Respondent
                                              </span>
                                              <p className="text-sm text-gray-900">
                                                {selectedResponse.user.name ||
                                                  "Anonymous"}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-sm font-medium text-gray-600">
                                                Email
                                              </span>
                                              <p className="text-sm text-gray-900">
                                                {selectedResponse.user.email}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-sm font-medium text-gray-600">
                                                Submitted At
                                              </span>
                                              <p className="text-sm text-gray-900">
                                                {new Date(
                                                  selectedResponse.createdAt
                                                ).toLocaleString()}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-sm font-medium text-gray-600">
                                                Privacy Consent
                                              </span>
                                              <Badge
                                                variant={
                                                  selectedResponse.isChecked
                                                    ? "default"
                                                    : "destructive"
                                                }
                                                className="flex items-center space-x-1 w-fit mt-1"
                                              >
                                                {selectedResponse.isChecked ? (
                                                  <>
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span>Granted</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <XCircle className="w-3 h-3" />
                                                    <span>Denied</span>
                                                  </>
                                                )}
                                              </Badge>
                                            </div>
                                          </div>

                                          <div className="space-y-3">
                                            <h4 className="font-medium">
                                              Form Answers
                                            </h4>
                                            {selectedResponse.answers.length ===
                                            0 ? (
                                              <p className="text-gray-500 text-sm">
                                                No answers provided
                                              </p>
                                            ) : (
                                              selectedResponse.answers.map(
                                                (answer) => (
                                                  <div
                                                    key={answer.id}
                                                    className="p-3 border rounded-lg"
                                                  >
                                                    <div className="text-sm font-medium text-gray-600 mb-1">
                                                      {formData?.fieldLabels?.[
                                                        answer.fieldId
                                                      ] || "Unknown Field"}
                                                    </div>
                                                    <div className="text-sm text-gray-900">
                                                      {answer.fieldType ===
                                                        "matrix" &&
                                                      answer.rowId &&
                                                      answer.columnId ? (
                                                        <div>
                                                          <span className="font-medium">
                                                            {answer.rowId}:
                                                          </span>{" "}
                                                          {answer.columnId}
                                                        </div>
                                                      ) : (
                                                        answer.value
                                                      )}
                                                    </div>
                                                  </div>
                                                )
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
