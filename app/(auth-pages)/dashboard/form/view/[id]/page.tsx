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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Shield,
  Edit,
  Save,
  X,
  Eye,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface FormField {
  id: string;
  type:
    | "input"
    | "selection"
    | "multipleChoice"
    | "rating"
    | "matrix"
    | "netPromoterScore"
    | "separator";
  label: string;
  required: boolean;
  inputType?: string;
  options?: string[];
  maxChoices?: number;
  // For rating
  maxRating?: number;
  showLabels?: boolean;
  labels?: string[];
  // For matrix
  rows?: string[];
  columns?: string[];
  // For net promoter score
  leftLabel?: string;
  rightLabel?: string;
  maxScore?: number;
  // For separator
  description?: string;
}

interface FormAnswer {
  id: string;
  fieldId: string;
  fieldType: string;
  value: string;
  rowId?: string;
  columnId?: string;
  fieldLabel: string;
}

interface FormSubmission {
  id: string;
  formTitle: string;
  formDescription: string | null;
  isCompulsory: boolean;
  isChecked: boolean;
  submittedAt: string;
  userEmail: string;
  userName: string;
  fields: FormField[];
  answers: FormAnswer[];
}

interface EditAnswer {
  fieldId: string;
  fieldType: string;
  value: string;
  rowId?: string;
  columnId?: string;
}

// Helper functions for preparing answers
const addRegularFieldAnswers = (
  submission: FormSubmission,
  editAnswers: { [fieldId: string]: string },
  updatedAnswers: EditAnswer[]
) => {
  for (const [fieldId, value] of Object.entries(editAnswers)) {
    const field = submission.fields.find((f) => f.id === fieldId);
    if (field && value.trim()) {
      updatedAnswers.push({
        fieldId,
        fieldType: field.type,
        value: value.trim(),
      });
    }
  }
};

const addMultipleChoiceAnswers = (
  editMultipleChoiceAnswers: { [fieldId: string]: string[] },
  updatedAnswers: EditAnswer[]
) => {
  for (const [fieldId, values] of Object.entries(editMultipleChoiceAnswers)) {
    if (values.length > 0) {
      updatedAnswers.push({
        fieldId,
        fieldType: "multipleChoice",
        value: values.join(", "),
      });
    }
  }
};

const addRatingAnswers = (
  editRatingAnswers: { [fieldId: string]: number },
  updatedAnswers: EditAnswer[]
) => {
  for (const [fieldId, rating] of Object.entries(editRatingAnswers)) {
    if (rating > 0) {
      updatedAnswers.push({
        fieldId,
        fieldType: "rating",
        value: rating.toString(),
      });
    }
  }
};

const addMatrixAnswers = (
  editMatrixAnswers: { [fieldId: string]: { [rowId: string]: string } },
  updatedAnswers: EditAnswer[]
) => {
  for (const [fieldId, rowAnswers] of Object.entries(editMatrixAnswers)) {
    for (const [rowId, columnId] of Object.entries(rowAnswers)) {
      updatedAnswers.push({
        fieldId,
        fieldType: "matrix",
        value: columnId,
        rowId,
        columnId,
      });
    }
  }
};

const addNetPromoterAnswers = (
  editNetPromoterAnswers: { [fieldId: string]: number },
  updatedAnswers: EditAnswer[]
) => {
  for (const [fieldId, score] of Object.entries(editNetPromoterAnswers)) {
    if (score !== undefined) {
      updatedAnswers.push({
        fieldId,
        fieldType: "netPromoterScore",
        value: score.toString(),
      });
    }
  }
};

// Helper function to prepare updated answers for saving
const prepareUpdatedAnswers = (
  submission: FormSubmission,
  editAnswers: { [fieldId: string]: string },
  editMultipleChoiceAnswers: { [fieldId: string]: string[] },
  editRatingAnswers: { [fieldId: string]: number },
  editMatrixAnswers: { [fieldId: string]: { [rowId: string]: string } },
  editNetPromoterAnswers: { [fieldId: string]: number }
): EditAnswer[] => {
  const updatedAnswers: EditAnswer[] = [];

  addRegularFieldAnswers(submission, editAnswers, updatedAnswers);
  addMultipleChoiceAnswers(editMultipleChoiceAnswers, updatedAnswers);
  addRatingAnswers(editRatingAnswers, updatedAnswers);
  addMatrixAnswers(editMatrixAnswers, updatedAnswers);
  addNetPromoterAnswers(editNetPromoterAnswers, updatedAnswers);

  return updatedAnswers;
};

// Helper function to initialize edit state from submission data
const initializeEditState = (submission: FormSubmission) => {
  const answers: { [fieldId: string]: string } = {};
  const multipleChoiceAnswers: { [fieldId: string]: string[] } = {};
  const ratingAnswers: { [fieldId: string]: number } = {};
  const matrixAnswers: { [fieldId: string]: { [rowId: string]: string } } = {};
  const netPromoterAnswers: { [fieldId: string]: number } = {};

  for (const answer of submission.answers) {
    if (answer.fieldType === "multipleChoice") {
      multipleChoiceAnswers[answer.fieldId] = answer.value
        .split(", ")
        .filter((v) => v.trim());
    } else if (answer.fieldType === "rating") {
      ratingAnswers[answer.fieldId] = Number.parseInt(answer.value) || 0;
    } else if (answer.fieldType === "matrix") {
      if (answer.rowId && answer.columnId) {
        if (!matrixAnswers[answer.fieldId]) {
          matrixAnswers[answer.fieldId] = {};
        }
        matrixAnswers[answer.fieldId][answer.rowId] = answer.columnId;
      }
    } else if (answer.fieldType === "netPromoterScore") {
      netPromoterAnswers[answer.fieldId] = Number.parseInt(answer.value) || 0;
    } else {
      answers[answer.fieldId] = answer.value;
    }
  }

  return {
    answers,
    multipleChoiceAnswers,
    ratingAnswers,
    matrixAnswers,
    netPromoterAnswers,
    privacyConsent: submission.isChecked,
  };
};

// Component for loading state
const LoadingState = ({
  handleTabChange,
  handleLogout,
}: {
  handleTabChange: (tab: string) => void;
  handleLogout: () => void;
}) => (
  <div className="min-h-screen bg-cyan-50 pt-24">
    <DashboardHeader
      activeTab="forms"
      onTabChange={handleTabChange}
      onLogout={handleLogout}
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-white shadow-sm border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              View Form Submission
            </h1>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center">
              <Loader size={32} className="mb-3 text-blue-500" />
              <p className="text-gray-600">Loading submission...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Component for error state
const ErrorState = ({
  error,
  handleTabChange,
  handleLogout,
}: {
  error: string;
  handleTabChange: (tab: string) => void;
  handleLogout: () => void;
}) => (
  <div className="min-h-screen bg-cyan-50 pt-24">
    <DashboardHeader
      activeTab="forms"
      onTabChange={handleTabChange}
      onLogout={handleLogout}
    />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-white shadow-sm border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              View Form Submission
            </h1>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-red-500">{error}</div>
        </div>
      </div>
    </div>
  </div>
);

export default function AdminFormViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editAnswers, setEditAnswers] = useState<{ [fieldId: string]: string }>(
    {}
  );
  const [editMultipleChoiceAnswers, setEditMultipleChoiceAnswers] = useState<{
    [fieldId: string]: string[];
  }>({});
  const [editRatingAnswers, setEditRatingAnswers] = useState<{
    [fieldId: string]: number;
  }>({});
  const [editMatrixAnswers, setEditMatrixAnswers] = useState<{
    [fieldId: string]: { [rowId: string]: string };
  }>({});
  const [editNetPromoterAnswers, setEditNetPromoterAnswers] = useState<{
    [fieldId: string]: number;
  }>({});
  const [editPrivacyConsent, setEditPrivacyConsent] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }
    fetchSubmission();
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

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Page not found</p>
        </div>
      </div>
    );
  }

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/forms/responses/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Form submission not found");
        }
        throw new Error("Failed to fetch submission");
      }
      const data = await response.json();
      setSubmission(data);

      // Initialize edit state using helper function
      const editState = initializeEditState(data);
      setEditAnswers(editState.answers);
      setEditMultipleChoiceAnswers(editState.multipleChoiceAnswers);
      setEditRatingAnswers(editState.ratingAnswers);
      setEditMatrixAnswers(editState.matrixAnswers);
      setEditNetPromoterAnswers(editState.netPromoterAnswers);
      setEditPrivacyConsent(editState.privacyConsent);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load submission"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (fieldId: string, value: string) => {
    setEditAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleEditMultipleChoiceChange = (
    fieldId: string,
    option: string,
    checked: boolean
  ) => {
    setEditMultipleChoiceAnswers((prev) => {
      const current = prev[fieldId] || [];
      const field = submission?.fields.find((f) => f.id === fieldId);
      const maxChoices = field?.maxChoices || 1;

      if (checked) {
        if (current.length < maxChoices) {
          return {
            ...prev,
            [fieldId]: [...current, option],
          };
        } else {
          toast.error(`Maximum ${maxChoices} choices allowed`);
          return prev;
        }
      } else {
        return {
          ...prev,
          [fieldId]: current.filter((item) => item !== option),
        };
      }
    });
  };

  const handleEditRatingChange = (fieldId: string, rating: number) => {
    setEditRatingAnswers((prev) => ({
      ...prev,
      [fieldId]: rating,
    }));
  };

  const handleEditMatrixChange = (
    fieldId: string,
    rowId: string,
    columnId: string
  ) => {
    setEditMatrixAnswers((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        [rowId]: columnId,
      },
    }));
  };

  const handleEditNetPromoterChange = (fieldId: string, score: number) => {
    const field = submission?.fields.find((f) => f.id === fieldId);
    const maxScore = field?.maxScore || 10;

    if (score >= 0 && score <= maxScore) {
      setEditNetPromoterAnswers((prev) => ({
        ...prev,
        [fieldId]: score,
      }));
    }
  };

  // Helper function to handle matrix radio change
  const createMatrixRadioHandler = (
    fieldId: string,
    row: string,
    column: string
  ) => {
    return () => handleEditMatrixChange(fieldId, row, column);
  };
  const isValidMatrixField = (
    field: FormField
  ): field is FormField & { rows: string[]; columns: string[] } => {
    return (
      field.type === "matrix" &&
      Array.isArray(field.rows) &&
      Array.isArray(field.columns) &&
      field.rows.length > 0 &&
      field.columns.length > 0
    );
  };

  const handleSave = async () => {
    if (!submission) return;

    try {
      setSaving(true);

      // Prepare updated answers using helper function
      const updatedAnswers = prepareUpdatedAnswers(
        submission,
        editAnswers,
        editMultipleChoiceAnswers,
        editRatingAnswers,
        editMatrixAnswers,
        editNetPromoterAnswers
      );

      const response = await fetch(
        `/api/admin/forms/responses/${params.id}/edit`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: updatedAnswers,
            isChecked: editPrivacyConsent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update form submission");
      }

      toast.success("Form submission updated successfully!");
      setIsEditMode(false);
      fetchSubmission(); // Refresh data
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update submission"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset edit state to current values using helper function
    if (submission) {
      const editState = initializeEditState(submission);
      setEditAnswers(editState.answers);
      setEditMultipleChoiceAnswers(editState.multipleChoiceAnswers);
      setEditRatingAnswers(editState.ratingAnswers);
      setEditMatrixAnswers(editState.matrixAnswers);
      setEditNetPromoterAnswers(editState.netPromoterAnswers);
      setEditPrivacyConsent(editState.privacyConsent);
    }
  };

  // Helper function to get field value based on type and mode
  const getFieldValueByType = (
    field: FormField,
    answer: FormAnswer | undefined
  ) => {
    if (field.type === "multipleChoice") {
      return answer ? answer.value.split(", ").filter((v) => v.trim()) : [];
    }
    if (field.type === "rating" || field.type === "netPromoterScore") {
      return answer ? Number.parseInt(answer.value) || 0 : 0;
    }
    if (field.type === "matrix") {
      const matrixAnswers: { [rowId: string]: string } = {};
      for (const a of submission?.answers || []) {
        if (a.fieldId === field.id && a.rowId && a.columnId) {
          matrixAnswers[a.rowId] = a.columnId;
        }
      }
      return matrixAnswers;
    }
    return answer?.value || "";
  };

  // Simplified field value retrieval
  const getEditModeValue = (field: FormField) => {
    const typeValueMap = {
      multipleChoice: editMultipleChoiceAnswers[field.id] || [],
      rating: editRatingAnswers[field.id] || 0,
      matrix: editMatrixAnswers[field.id] || {},
      netPromoterScore: editNetPromoterAnswers[field.id] || 0,
    };
    return (
      typeValueMap[field.type as keyof typeof typeValueMap] ??
      (editAnswers[field.id] || "")
    );
  };

  const getCurrentFieldValue = (field: FormField) => {
    if (isEditMode) {
      return getEditModeValue(field);
    }
    const answer = submission?.answers.find((a) => a.fieldId === field.id);
    return getFieldValueByType(field, answer);
  };

  // Field renderers to reduce complexity
  const renderInputField = (field: FormField, currentValue: unknown) => {
    if (isEditMode) {
      return (
        <Input
          type={field.inputType || "text"}
          value={currentValue as string}
          onChange={(e) => handleEditInputChange(field.id, e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }
    return (
      <div className="bg-gray-50 p-3 rounded border">
        <p className="text-gray-900">
          {typeof currentValue === "string" ? currentValue : "No response"}
        </p>
      </div>
    );
  };

  const renderSelectionField = (field: FormField, currentValue: unknown) => {
    if (!field.options) return null;

    if (isEditMode) {
      return (
        <RadioGroup
          value={currentValue as string}
          onValueChange={(value) => handleEditInputChange(field.id, value)}
          className="space-y-2"
        >
          {field.options.map((option) => (
            <div
              key={`${field.id}-${option}`}
              className="flex items-center space-x-2"
            >
              <RadioGroupItem value={option} id={`${field.id}-${option}`} />
              <Label htmlFor={`${field.id}-${option}`} className="text-sm">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }
    return (
      <div className="bg-gray-50 p-3 rounded border">
        <p className="text-gray-900">
          {typeof currentValue === "string" ? currentValue : "No selection"}
        </p>
      </div>
    );
  };

  const renderMultipleChoiceField = (
    field: FormField,
    currentValue: unknown
  ) => {
    if (!field.options) return null;

    if (isEditMode) {
      return (
        <div className="space-y-2">
          {field.options.map((option) => (
            <div
              key={`${field.id}-${option}`}
              className="flex items-center space-x-2"
            >
              <Checkbox
                id={`${field.id}-${option}`}
                checked={(currentValue as string[]).includes(option)}
                onCheckedChange={(checked) =>
                  handleEditMultipleChoiceChange(
                    field.id,
                    option,
                    checked as boolean
                  )
                }
              />
              <Label htmlFor={`${field.id}-${option}`} className="text-sm">
                {option}
              </Label>
            </div>
          ))}
          <p className="text-xs text-gray-500">
            Maximum {field.maxChoices} choice(s) allowed
          </p>
        </div>
      );
    }
    return (
      <div className="bg-gray-50 p-3 rounded border">
        <p className="text-gray-900">
          {Array.isArray(currentValue) && currentValue.length > 0
            ? currentValue.join(", ")
            : "No selections"}
        </p>
      </div>
    );
  };

  const renderRatingField = (field: FormField, currentValue: unknown) => {
    if (isEditMode) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            {Array.from({ length: field.maxRating || 5 }).map((_, index) => {
              const starKey = `${field.id}-star-${index + 1}`;
              return (
                <button
                  key={starKey}
                  type="button"
                  onClick={() => handleEditRatingChange(field.id, index + 1)}
                  className={`p-1 transition-colors ${
                    (currentValue as number) >= index + 1
                      ? "text-yellow-500"
                      : "text-gray-300 hover:text-yellow-400"
                  }`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              );
            })}
          </div>
          {field.showLabels && field.labels && field.labels.length > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              {field.labels.map((label) => (
                <span
                  key={`${field.id}-label-${label}`}
                  className="text-center flex-1"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-600">
            Rating: {currentValue as number} out of {field.maxRating || 5}
          </p>
        </div>
      );
    }
    return (
      <div className="bg-gray-50 p-3 rounded border">
        <div className="flex items-center space-x-2">
          {Array.from({ length: field.maxRating || 5 }).map((_, index) => {
            const starKey = `${field.id}-view-star-${index + 1}`;
            return (
              <Star
                key={starKey}
                className={`w-5 h-5 ${
                  (currentValue as number) >= index + 1
                    ? "text-yellow-500 fill-current"
                    : "text-gray-300"
                }`}
              />
            );
          })}
          <span className="text-gray-600 ml-2">
            {currentValue as number} out of {field.maxRating || 5}
          </span>
        </div>
      </div>
    );
  };

  const renderMatrixField = (field: FormField, currentValue: unknown) => {
    if (!isValidMatrixField(field)) return null;

    if (isEditMode) {
      return (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left font-medium">
                    Questions
                  </th>
                  {field.columns.map((column) => (
                    <th
                      key={`${field.id}-col-${column}`}
                      className="border border-gray-300 p-2 text-center font-medium"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {field.rows.map((row) => (
                  <tr key={`${field.id}-row-${row}`}>
                    <td className="border border-gray-300 p-2 font-medium">
                      {row}
                    </td>
                    {field.columns.map((column) => (
                      <td
                        key={`${field.id}-cell-${row}-${column}`}
                        className="border border-gray-300 p-2 text-center"
                      >
                        <input
                          type="radio"
                          name={`matrix-${field.id}-${row}`}
                          value={column}
                          checked={
                            (currentValue as { [rowId: string]: string })[
                              row
                            ] === column
                          }
                          onChange={createMatrixRadioHandler(
                            field.id,
                            row,
                            column
                          )}
                          className="w-4 h-4 text-blue-600"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-gray-50 p-3 rounded border">
        <div className="space-y-2">
          {Object.entries(currentValue as { [rowId: string]: string }).map(
            ([rowId, columnId]) => (
              <div key={rowId} className="text-sm">
                <span className="font-medium">{rowId}:</span> {columnId}
              </div>
            )
          )}
          {Object.keys(currentValue as { [rowId: string]: string }).length ===
            0 && <p className="text-gray-500">No selections made</p>}
        </div>
      </div>
    );
  };

  const renderNetPromoterField = (field: FormField, currentValue: unknown) => {
    if (isEditMode) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{field.leftLabel}</span>
            <span>{field.rightLabel}</span>
          </div>
          <div className="flex items-center space-x-2">
            {Array.from({ length: (field.maxScore || 10) + 1 }).map(
              (_, index) => {
                const buttonKey = `${field.id}-nps-edit-${index}`;
                return (
                  <button
                    key={buttonKey}
                    type="button"
                    onClick={() => handleEditNetPromoterChange(field.id, index)}
                    className={`w-8 h-8 rounded border transition-colors ${
                      (currentValue as number) === index
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {index}
                  </button>
                );
              }
            )}
          </div>
          <p className="text-sm text-gray-600">
            Score: {currentValue as number} out of {field.maxScore || 10}
          </p>
        </div>
      );
    }
    return (
      <div className="bg-gray-50 p-3 rounded border">
        <div className="flex items-center space-x-2">
          {Array.from({ length: (field.maxScore || 10) + 1 }).map(
            (_, index) => {
              const divKey = `${field.id}-nps-view-${index}`;
              return (
                <div
                  key={divKey}
                  className={`w-4 h-4 rounded border-2 ${
                    (currentValue as number) === index
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              );
            }
          )}
          <span className="text-gray-600 ml-2">
            Score: {currentValue as number} out of {field.maxScore || 10}
          </span>
        </div>
      </div>
    );
  };

  const renderSeparatorField = (field: FormField) => (
    <div className="border-t-2 border-gray-300 pt-4 mt-6">
      <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
      {field.description && (
        <p className="text-sm text-gray-600 mt-2">{field.description}</p>
      )}
    </div>
  );

  // Helper to render privacy consent section
  const renderPrivacyConsent = () => (
    <div className="border-t pt-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          {isEditMode ? (
            <Checkbox
              id="privacy-consent-edit"
              checked={editPrivacyConsent}
              onCheckedChange={(checked) =>
                setEditPrivacyConsent(checked as boolean)
              }
            />
          ) : (
            <div className="mt-1">
              {submission?.isChecked ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
          )}
          <div className="flex-1">
            <Label
              htmlFor={isEditMode ? "privacy-consent-edit" : undefined}
              className={`text-sm font-medium text-gray-900 ${
                isEditMode ? "cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-yellow-600" />
                <span>Privacy Consent</span>
                <span className="text-red-500">*</span>
              </div>
            </Label>
            <p className="text-sm text-gray-700 leading-relaxed">
              I consent to the processing of my personal data and agree to the
              privacy policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <LoadingState
        handleTabChange={handleTabChange}
        handleLogout={handleLogout}
      />
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Page not found</p>
          <button
            onClick={() => router.push("/dashboard?tab=forms")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        handleTabChange={handleTabChange}
        handleLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cyan-50 pt-24 overflow-x-hidden">
      <DashboardHeader
        activeTab="forms"
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
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
        {/* View Form Submission Content */}
        <div className="bg-white shadow-sm border rounded-lg overflow-x-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? "Edit Form Submission" : "View Form Submission"}
              </h1>
              <div className="flex items-center space-x-2">
                {/* <button
                  onClick={() => router.push("/dashboard?tab=forms")}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  ← Back to Forms
                </button> */}
                {isEditMode ? (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Saving..." : "Save"}</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Info Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Submission Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        User
                      </Label>
                      <p className="text-sm text-gray-900">
                        {submission?.userName}
                      </p>
                      <p className="text-xs text-gray-500 break-all">
                        {submission?.userEmail}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Submitted
                      </Label>
                      <div className="flex items-center space-x-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {submission
                            ? new Date(
                                submission.submittedAt
                              ).toLocaleDateString()
                            : ""}{" "}
                          at{" "}
                          {submission
                            ? new Date(
                                submission.submittedAt
                              ).toLocaleTimeString()
                            : ""}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Form Type
                      </Label>
                      <div className="flex items-center space-x-2">
                        {submission?.isCompulsory ? (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Optional
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Privacy Consent
                      </Label>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const consentGranted = isEditMode
                            ? editPrivacyConsent
                            : submission?.isChecked;

                          return consentGranted ? (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-100 text-green-800"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Granted
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-red-100 text-red-800"
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Denied
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Form Content */}
              <div className="lg:col-span-2">
                <Card className="overflow-x-hidden">
                  <CardHeader className="overflow-hidden">
                    <CardTitle className="flex items-center space-x-3 break-all">
                      <span className="break-all">{submission?.formTitle}</span>
                      <div className="flex items-center space-x-1">
                        {isEditMode ? (
                          <Edit className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                    </CardTitle>
                    {submission?.formDescription && (
                      <CardDescription className="break-all">
                        {submission.formDescription}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Form Fields */}
                    {submission?.fields.map((field) => {
                      const currentValue = getCurrentFieldValue(field);

                      return (
                        <div key={field.id} className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>

                          {/* Render different field types using extracted functions */}
                          {field.type === "input" &&
                            renderInputField(field, currentValue)}
                          {field.type === "selection" &&
                            renderSelectionField(field, currentValue)}
                          {field.type === "multipleChoice" &&
                            renderMultipleChoiceField(field, currentValue)}
                          {field.type === "rating" &&
                            renderRatingField(field, currentValue)}
                          {field.type === "matrix" &&
                            renderMatrixField(field, currentValue)}
                          {field.type === "netPromoterScore" &&
                            renderNetPromoterField(field, currentValue)}
                          {field.type === "separator" &&
                            renderSeparatorField(field)}
                        </div>
                      );
                    })}

                    {/* Privacy Consent */}
                    {renderPrivacyConsent()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
