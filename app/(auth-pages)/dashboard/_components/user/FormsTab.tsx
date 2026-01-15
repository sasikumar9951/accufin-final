import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FormInput, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client-api";
import { useRouter } from "next/navigation";

type FormWithStatus = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isCompulsory: boolean;
  createdAt: string;
  isCompleted: boolean;
  completedAt: string | null;
};

type FormsTabProps = {
  readonly refreshKey?: number;
};

const getFormStatus = (form: FormWithStatus) => {
  if (form.isCompleted) {
    return {
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      statusIcon: <CheckCircle className="w-5 h-5 text-green-600" />,
      statusText: "Completed",
      statusTextColor: "text-green-700"
    };
  }
  
  if (form.isCompulsory) {
    return {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      statusIcon: <AlertCircle className="w-5 h-5 text-red-600" />,
      statusText: "Required",
      statusTextColor: "text-red-700"
    };
  }
  
  return {
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    statusIcon: <Clock className="w-5 h-5 text-blue-600" />,
    statusText: "Optional",
    statusTextColor: "text-blue-700"
  };
};

export default function FormsTab({ refreshKey = 0 }: FormsTabProps) {
  const router = useRouter();
  const [forms, setForms] = useState<FormWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch forms data
  const fetchForms = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/user/forms", { logoutOn401: false });
      if (!res.ok) throw new Error("Failed to fetch forms");
      const data = await res.json();
      setForms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching forms:", error);
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [refreshKey]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchForms();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <div className="flex justify-end px-0 pb-4">
        <button
          onClick={handleRefresh}
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
            className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-3.51-7.07" />
            <polyline points="22 3 21 7 17 6" />
          </svg>
        </button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Available Forms</CardTitle>
          <CardDescription>
            Complete required forms and view optional ones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="w-full h-[40vh] flex items-center justify-center">
                <div className="flex flex-col items-center text-gray-600">
                  <Loader size={48} className="mb-2 text-cyan-600" />
                  Loading forms...
                </div>
              </div>
            ) : (
              renderFormsContent()
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );

  function renderFormsContent() {
    if (forms.length === 0) {
      return (
        <div className="text-center py-12">
          <FormInput className="w-16 h-16 mx-auto mb-4 text-gray-300 opacity-20" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Forms Available
          </h3>
          <p className="text-gray-500">
            There are no forms assigned to you at the moment.
          </p>
        </div>
      );
    }

    return forms.map((form) => {
      const status = getFormStatus(form);
      
      return (
        <div
          key={form.id}
          className={`p-4 border rounded-lg ${status.bgColor} ${status.borderColor} hover:shadow-md transition-shadow`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {form.title}
                </h3>
                <div className="flex items-center space-x-1">
                  {status.statusIcon}
                  <span
                    className={`text-sm font-medium ${status.statusTextColor}`}
                  >
                    {status.statusText}
                  </span>
                </div>
                          {form.isCompulsory && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        {form.description && (
                          <p className="text-gray-600 mb-3 text-sm">
                            {form.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            Created{" "}
                            {new Date(form.createdAt).toLocaleDateString()}
                          </span>
                          {form.completedAt && (
                            <>
                              <span>•</span>
                              <span>
                                Completed{" "}
                                {new Date(
                                  form.completedAt
                                ).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {form.isCompleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/forms/${form.id}/view`)
                            }
                            className="flex items-center space-x-1"
                          >
                            <FormInput className="w-4 h-4" />
                            <span>View Submission</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/forms/${form.id}/fill`)
                            }
                            className={`flex items-center space-x-1 ${
                              form.isCompulsory
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            <FormInput className="w-4 h-4" />
                            <span>Fill Form</span>
                          </Button>
                        )}
            </div>
          </div>
        </div>
      );
    });
  }
}
