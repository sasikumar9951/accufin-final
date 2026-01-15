"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@/components/ui/loader";
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
  ArrowLeft,
  Send,
  AlertCircle,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import ShowTerms from "@/components/showTerms";

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

interface FormData {
  id: string;
  title: string;
  description: string | null;
  isCompulsory: boolean;
  privacyLabel: string;
  fields: FormField[];
}

interface FormAnswer {
  fieldId: string;
  fieldType: string;
  value: string;
  rowId?: string;
  columnId?: string;
}

export default function FormFillPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form answers state
  const [answers, setAnswers] = useState<{ [fieldId: string]: string }>({});
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<{
    [fieldId: string]: string[];
  }>({});
  const [ratingAnswers, setRatingAnswers] = useState<{
    [fieldId: string]: number;
  }>({});
  const [hoverRating, setHoverRating] = useState<{ [fieldId: string]: number }>(
    {}
  );
  const [matrixAnswers, setMatrixAnswers] = useState<{
    [fieldId: string]: { [rowId: string]: string };
  }>({});
  const [netPromoterAnswers, setNetPromoterAnswers] = useState<{
    [fieldId: string]: number;
  }>({});
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const toggleTerms = () => setShowTerms(!showTerms);

  // Handler functions to reduce nesting
  const handleRatingHover = (fieldId: string, rating: number) => {
    setHoverRating((prev) => ({
      ...prev,
      [fieldId]: rating,
    }));
  };

  const handleRatingLeave = (fieldId: string) => {
    setHoverRating((prev) => {
      const { [fieldId]: _omit, ...rest } = prev;
      return rest;
    });
  };



  // Helper functions to create handlers without deep nesting
  const createMatrixHandler = (fieldId: string, row: string, column: string) => 
    () => handleMatrixChange(fieldId, row, column);

  const createNetPromoterHandler = (fieldId: string, score: number) => 
    () => handleNetPromoterChange(fieldId, score);

  const hasLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user?.isAdmin) {
      router.push("/dashboard");
      return;
    }

    const currentId = String(params.id);
    if (hasLoadedRef.current === currentId) return;

    fetchFormData();
    hasLoadedRef.current = currentId;
  }, [session, status, params.id]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/forms/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Form not found");
        }
        throw new Error("Failed to fetch form");
      }
      const data = await response.json();
      setFormData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleMultipleChoiceChange = (
    fieldId: string,
    option: string,
    checked: boolean
  ) => {
    setMultipleChoiceAnswers((prev) => {
      const current = prev[fieldId] || [];
      const field = formData?.fields.find((f) => f.id === fieldId);
      const maxChoices = field?.maxChoices || 1;

      if (checked) {
        if (current.length < maxChoices) {
          return {
            ...prev,
            [fieldId]: [...current, option],
          };
        } else {
          toast.error(`You can select maximum ${maxChoices} options`);
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

  const handleRatingChange = (fieldId: string, rating: number) => {
    setRatingAnswers((prev) => ({
      ...prev,
      [fieldId]: rating,
    }));
  };

  const handleMatrixChange = (
    fieldId: string,
    rowId: string,
    columnId: string
  ) => {
    setMatrixAnswers((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        [rowId]: columnId,
      },
    }));
  };

  const handleNetPromoterChange = (fieldId: string, score: number) => {
    const field = formData?.fields.find((f) => f.id === fieldId);
    const maxScore = field?.maxScore || 10;

    // Ensure score is within valid range (0 to maxScore)
    if (score >= 0 && score <= maxScore) {
      setNetPromoterAnswers((prev) => ({
        ...prev,
        [fieldId]: score,
      }));
    } else {
      toast.error(`Please select a valid score between 0 and ${maxScore}`);
    }
  };

  // Helper function to check if field is a valid matrix field
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

  // Helper functions for field validation
  const validateMultipleChoice = (field: FormField) => {
    const selected = multipleChoiceAnswers[field.id];
    if (!selected || selected.length === 0) {
      toast.error(`Please answer the required field: ${field.label}`);
      return false;
    }
    return true;
  };

  const validateRating = (field: FormField) => {
    const rating = ratingAnswers[field.id];
    if (rating === undefined || rating === 0) {
      toast.error(`Please answer the required field: ${field.label}`);
      return false;
    }
    return true;
  };

  const validateMatrix = (field: FormField) => {
    const matrixAnswer = matrixAnswers[field.id];
    if (!matrixAnswer || Object.keys(matrixAnswer).length === 0) {
      toast.error(`Please answer the required field: ${field.label}`);
      return false;
    }
    return true;
  };

  const validateNetPromoterScore = (field: FormField) => {
    const score = netPromoterAnswers[field.id];
    if (score === undefined) {
      toast.error(`Please answer the required field: ${field.label}`);
      return false;
    }
    const maxScore = field.maxScore || 10;
    if (score < 0 || score > maxScore) {
      toast.error(
        `Please select a valid score between 0 and ${maxScore} for: ${field.label}`
      );
      return false;
    }
    return true;
  };

  const validateInput = (field: FormField) => {
    const answer = answers[field.id];
    if (!answer || answer.trim() === "") {
      toast.error(`Please answer the required field: ${field.label}`);
      return false;
    }
    return true;
  };

  // Helper to validate a single field
  const validateField = (field: FormField): boolean => {
    if (!field.required) return true;
    switch (field.type) {
      case "multipleChoice":
        return validateMultipleChoice(field);
      case "rating":
        return validateRating(field);
      case "matrix":
        return validateMatrix(field);
      case "netPromoterScore":
        return validateNetPromoterScore(field);
      case "separator":
        return true;
      default:
        return validateInput(field);
    }
  };

  const validateForm = (): boolean => {
    if (!formData) return false;

    if (!privacyConsent) {
      toast.error("You must agree to the privacy policy to submit the form");
      return false;
    }

    for (const field of formData.fields) {
      if (!validateField(field)) return false;
    }
    return true;
  };

  // Helper functions to prepare form answers
  const addRegularAnswers = (formAnswers: FormAnswer[]) => {
    for (const [fieldId, value] of Object.entries(answers)) {
      if (value.trim()) {
        const field = formData?.fields.find((f) => f.id === fieldId);
        if (field) {
          formAnswers.push({
            fieldId,
            fieldType: field.type,
            value: value.trim(),
          });
        }
      }
    }
  };

  const addMultipleChoiceAnswers = (formAnswers: FormAnswer[]) => {
    for (const [fieldId, values] of Object.entries(multipleChoiceAnswers)) {
      if (values.length > 0) {
        formAnswers.push({
          fieldId,
          fieldType: "multipleChoice",
          value: values.join(", "),
        });
      }
    }
  };

  const addRatingAnswers = (formAnswers: FormAnswer[]) => {
    for (const [fieldId, rating] of Object.entries(ratingAnswers)) {
      if (rating > 0) {
        formAnswers.push({
          fieldId,
          fieldType: "rating",
          value: rating.toString(),
        });
      }
    }
  };

  const addMatrixAnswers = (formAnswers: FormAnswer[]) => {
    for (const [fieldId, rowAnswers] of Object.entries(matrixAnswers)) {
      for (const [rowId, columnId] of Object.entries(rowAnswers)) {
        formAnswers.push({
          fieldId,
          fieldType: "matrix",
          value: columnId,
          rowId,
          columnId,
        });
      }
    }
  };

  const addNetPromoterAnswers = (formAnswers: FormAnswer[]): boolean => {
    for (const [fieldId, score] of Object.entries(netPromoterAnswers)) {
      if (score !== undefined && typeof score === 'number') {
        const field = formData?.fields.find((f) => f.id === fieldId);
        const maxScore = field?.maxScore || 10;

        if (score >= 0 && score <= maxScore) {
          formAnswers.push({
            fieldId,
            fieldType: "netPromoterScore",
            value: score.toString(),
          });
        } else {
          const fieldLabel = typeof field?.label === 'string' ? field.label : "Net Promoter Score";
          toast.error(
            `Invalid score detected for ${fieldLabel}. Please try again.`
          );
          return false;
        }
      }
    }
    return true;
  };

  const prepareFormAnswers = (): FormAnswer[] | null => {
    const formAnswers: FormAnswer[] = [];
    
    addRegularAnswers(formAnswers);
    addMultipleChoiceAnswers(formAnswers);
    addRatingAnswers(formAnswers);
    addMatrixAnswers(formAnswers);
    
    if (!addNetPromoterAnswers(formAnswers)) {
      return null;
    }
    
    return formAnswers;
  };

  const submitFormData = async (formAnswers: FormAnswer[]) => {
    const response = await fetch(`/api/user/forms/${params.id}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answers: formAnswers,
        isChecked: privacyConsent,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit form");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const formAnswers = prepareFormAnswers();
      if (!formAnswers) return;

      console.log("Final form answers to submit:", formAnswers);

      await submitFormData(formAnswers);

      toast.success("Form submitted successfully!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader size={48} className="mb-4 text-blue-500" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.isAdmin) {
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
      <div className="min-h-screen bg-gray-50">
        <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b">
          <div className="relative h-16">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Fill Form</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <Card>
            <CardContent className="text-center py-8 text-red-500">
              {error}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b">
        <div className="relative h-14 sm:h-16">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full relative flex items-center justify-center overflow-hidden">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 text-center truncate">Fill Form</h1>
            {formData?.isCompulsory && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Badge
                  variant="destructive"
                  className="flex items-center space-x-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Required</span>
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-4 sm:pt-8 overflow-x-hidden">
        <Card className="overflow-x-hidden">
          <CardHeader className="overflow-hidden">
            <CardTitle className="flex items-center space-x-3 break-all">
              <span className="break-all">{formData?.title}</span>
              {formData?.isCompulsory && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </CardTitle>
            {formData?.description && (
              <CardDescription className="break-all">{formData.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Fields */}
              {formData?.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>

                  {/* Input Field */}
                  {field.type === "input" && (
                    <Input
                      type={field.inputType || "text"}
                      value={answers[field.id] || ""}
                      onChange={(e) =>
                        handleInputChange(field.id, e.target.value)
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  )}

                  {/* Radio Button (Selection) */}
                  {field.type === "selection" && field.options && (
                    <RadioGroup
                      value={answers[field.id] || ""}
                      onValueChange={(value) =>
                        handleInputChange(field.id, value)
                      }
                      className="space-y-2"
                    >
                      {field.options.map((option, index) => (
                        <div
                          key={`${field.id}-option-${index}`}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option}
                            id={`${field.id}-${index}`}
                          />
                          <Label
                            htmlFor={`${field.id}-${index}`}
                            className="text-sm"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {/* Multiple Choice (Checkbox) */}
                  {field.type === "multipleChoice" && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option) => (
                        <div
                          key={option}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${field.id}-${option}`}
                            checked={(
                              multipleChoiceAnswers[field.id] || []
                            ).includes(option)}
                            onCheckedChange={(checked) =>
                              handleMultipleChoiceChange(
                                field.id,
                                option,
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor={`${field.id}-${option}`}
                            className="text-sm"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">
                        Maximum {field.maxChoices} choice(s) allowed
                      </p>
                    </div>
                  )}

                  {/* Star Rating */}
                  {field.type === "rating" && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: field.maxRating || 5 }).map(
                          (_, index) => {
                            const hoverValue = hoverRating[field.id];
                            const effectiveValue =
                              (typeof hoverValue === "number" && hoverValue > 0)
                                ? hoverValue
                                : (ratingAnswers[field.id] || 0);
                            const activeThreshold = effectiveValue >= index + 1;
                            return (
                              <button
                                key={`${field.id}-star-${index}`}
                                type="button"
                                onMouseEnter={() =>
                                  handleRatingHover(field.id, index + 1)
                                }
                                onMouseLeave={() =>
                                  handleRatingLeave(field.id)
                                }
                                onClick={() =>
                                  handleRatingChange(field.id, index + 1)
                                }
                                className={`p-1 transition-colors ${
                                  activeThreshold
                                    ? "text-yellow-500"
                                    : "text-gray-300 hover:text-yellow-400"
                                }`}
                              >
                                <Star className="w-8 h-8 fill-current" />
                              </button>
                            );
                          }
                        )}
                      </div>
                      {field.showLabels &&
                        field.labels &&
                        field.labels.length > 0 && (
                          <div className="flex justify-between text-xs text-gray-500">
                            {field.labels.map((label) => (
                              <span key={label} className="text-center flex-1">
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      {Boolean(ratingAnswers[field.id]) && (
                        <p className="text-sm text-gray-600">
                          You rated: {ratingAnswers[field.id]} out of{" "}
                          {field.maxRating || 5}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Matrix/Table */}
                  {isValidMatrixField(field) && (
                    <div className="space-y-4">
                      {null}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 p-2 text-left font-medium">
                                Questions
                              </th>
                              {field.columns.map((column, colIndex) => (
                                <th
                                  key={`${field.id}-col-${colIndex}`}
                                  className="border border-gray-300 p-2 text-center font-medium"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {field.rows.map((row, rowIndex) => (
                              <tr key={`${field.id}-row-${rowIndex}`}>
                                <td className="border border-gray-300 p-2 font-medium">
                                  {row}
                                </td>
                                {field.columns.map((column, colIndex) => (
                                  <td
                                    key={`${field.id}-cell-${rowIndex}-${colIndex}`}
                                    className="border border-gray-300 p-2 text-center"
                                  >
                                    <input
                                      type="radio"
                                      name={`matrix-${field.id}-${rowIndex}`}
                                      value={column}
                                      checked={
                                        matrixAnswers[field.id]?.[row] ===
                                        column
                                      }
                                      onChange={createMatrixHandler(field.id, row, column)}
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
                  )}

                  {/* Net Promoter Score */}
                  {field.type === "netPromoterScore" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{field.leftLabel}</span>
                        <span>{field.rightLabel}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const maxScore = field.maxScore || 10;
                          const buttonCount = maxScore + 1; // 0 to maxScore inclusive
                          return Array.from({ length: buttonCount }).map(
                            (_, index) => (
                              <button
                                key={`${field.id}-nps-${index}`}
                                type="button"
                                onClick={createNetPromoterHandler(field.id, index)}
                                className={`w-8 h-8 rounded border transition-colors ${
                                  netPromoterAnswers[field.id] === index
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {index}
                              </button>
                            )
                          );
                        })()}
                      </div>
                      {netPromoterAnswers[field.id] !== undefined && (
                        <p className="text-sm text-gray-600">
                          You selected: {netPromoterAnswers[field.id]} out of{" "}
                          {field.maxScore || 10}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Section Separator */}
                  {field.type === "separator" && (
                    <div className="border-t-2 border-gray-300 pt-4 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {field.label}
                      </h3>
                      {field.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {field.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Privacy Consent */}
              <div className="border-t pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="privacy-consent"
                      checked={privacyConsent}
                      onCheckedChange={(checked) =>
                        setPrivacyConsent(checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="privacy-consent"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="w-4 h-4 text-yellow-600" />
                          <span>Privacy Consent</span>
                          <span className="text-red-500">*</span>
                        </div>
                      </Label>
                      <p className="text-sm text-gray-700 leading-relaxed break-words">
                        {formData?.privacyLabel}
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="ml-2 text-red-600 hover:underline text-md focus:outline-none"
                        >
                          Privacy Policy
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center space-x-2 ${
                    formData?.isCompulsory
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Submitting..." : "Submit Form"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      {showTerms && <ShowTerms toggleTerms={toggleTerms} />}
    </div>
  );
}
