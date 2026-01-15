"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Shield,
  AlertCircle,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FormAnswer {
  id: string;
  fieldId: string;
  fieldType: string;
  value: string;
  rowId?: string;
  columnId?: string;
  createdAt: string;
  fieldLabel: string;
  fieldData: {
    type: string;
    maxRating?: number;
    maxScore?: number;
  };
}

interface FormSubmission {
  id: string;
  formTitle: string;
  formDescription: string | null;
  isCompulsory: boolean;
  isChecked: boolean;
  submittedAt: string;
  answers: FormAnswer[];
}

// Helper function to get badge class based on field type
const getFieldTypeBadgeClass = (fieldType: string): string => {
  switch (fieldType) {
    case "rating":
      return "border-yellow-300 text-yellow-700";
    case "matrix":
      return "border-indigo-300 text-indigo-700";
    case "netPromoterScore":
      return "border-orange-300 text-orange-700";
    case "input":
      return "border-blue-300 text-blue-700";
    case "selection":
      return "border-green-300 text-green-700";
    case "multipleChoice":
      return "border-purple-300 text-purple-700";
    default:
      return "border-gray-300 text-gray-700";
  }
};

// Helper function to get badge label based on field type
const getFieldTypeBadgeLabel = (fieldType: string): string => {
  switch (fieldType) {
    case "rating":
      return "⭐ Star Rating";
    case "matrix":
      return "📊 Matrix";
    case "netPromoterScore":
      return "📈 NPS";
    case "input":
      return "📝 Input";
    case "selection":
      return "🔘 Selection";
    case "multipleChoice":
      return "☑️ Multiple Choice";
    default:
      return "📄 Other";
  }
};

// Rating component to reduce complexity
const RatingDisplay = ({ answer }: { answer: FormAnswer }) => (
  <div className="space-y-2">
    <div className="flex items-center space-x-1">
      {Array.from({ length: answer.fieldData.maxRating || 5 }).map(
        (_, index) => (
          <Star
            key={`star-${answer.id}-${index}`}
            className={`w-5 h-5 ${
              index < Number.parseInt(answer.value)
                ? "text-yellow-500 fill-current"
                : "text-gray-300"
            }`}
          />
        )
      )}
    </div>
    <div className="text-sm text-gray-600 font-medium">
      Rating: {answer.value} out of{" "}
      {answer.fieldData.maxRating || 5} stars
    </div>
  </div>
);

// Net Promoter Score component to reduce complexity
const NetPromoterScoreDisplay = ({ answer }: { answer: FormAnswer }) => (
  <div className="space-y-2">
    <div className="flex items-center space-x-1">
      {Array.from({
        length: (answer.fieldData.maxScore || 10) + 1,
      }).map((_, index) => (
        <div
          key={`nps-${answer.id}-${index}`}
          className={`w-4 h-4 rounded border-2 ${
            index === Number.parseInt(answer.value) &&
            Number.parseInt(answer.value) >= 0 &&
            Number.parseInt(answer.value) <= (answer.fieldData.maxScore || 10)
              ? "bg-blue-600 border-blue-600"
              : "bg-white border-gray-300"
          }`}
        />
      ))}
    </div>
    <div className="text-sm text-gray-600 font-medium">
      Net Promoter Score:{" "}
      {Number.parseInt(answer.value) >= 0 &&
      Number.parseInt(answer.value) <= (answer.fieldData.maxScore || 10)
        ? answer.value
        : "Invalid"}{" "}
      out of {answer.fieldData.maxScore || 10}
    </div>
  </div>
);

// Matrix display component to reduce complexity
const MatrixDisplay = ({ answer }: { answer: FormAnswer }) => (
  <div className="space-y-2">
    {answer.rowId && answer.columnId ? (
      <div className="text-gray-900">
        <div className="font-medium text-sm text-gray-700 mb-1">
          Selected Answer:
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-2">
          <span className="font-medium">Question:</span> {answer.rowId}
          <br />
          <span className="font-medium">Answer:</span> {answer.columnId}
        </div>
      </div>
    ) : (
      <div className="text-gray-900">
        <div className="font-medium text-sm text-gray-700 mb-1">
          Selected Answer:
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-2">
          {answer.value}
        </div>
      </div>
    )}
  </div>
);

// Default answer display component
const DefaultAnswerDisplay = ({ answer }: { answer: FormAnswer }) => (
  <div className="text-gray-900">
    <div className="font-medium text-sm text-gray-700 mb-1">Answer:</div>
    <div className="bg-blue-50 border border-blue-200 rounded p-2">
      {answer.value}
    </div>
  </div>
);

// Answer content component to reduce complexity
const AnswerContent = ({ answer }: { answer: FormAnswer }) => {
  switch (answer.fieldType) {
    case "rating":
      return <RatingDisplay answer={answer} />;
    case "netPromoterScore":
      return <NetPromoterScoreDisplay answer={answer} />;
    case "matrix":
      return <MatrixDisplay answer={answer} />;
    default:
      return <DefaultAnswerDisplay answer={answer} />;
  }
};

export default function ViewFormSubmissionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    fetchSubmission();
  }, [session, status, router, params.id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/forms/${params.id}/submission`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Form submission not found");
        }
        throw new Error("Failed to fetch submission");
      }
      const data = await response.json();
      setSubmission(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load submission"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader size={48} className="mb-4 text-blue-500" />
          <p className="text-gray-600">Loading submission...</p>
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
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="mr-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">
                  View Submission
                </h1>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="min-h-screen bg-gray-50 md:pt-[120px] pt-[150px]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                View Submission
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <CheckCircle className="w-3 h-3" />
                <span>Submitted</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <span>{submission?.formTitle}</span>
              {submission?.isCompulsory && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </CardTitle>
            {submission?.formDescription && (
              <CardDescription>{submission.formDescription}</CardDescription>
            )}
            <div className="text-sm text-gray-500">
              Submitted on{" "}
              {submission
                ? new Date(submission.submittedAt).toLocaleDateString()
                : ""}{" "}
              at{" "}
              {submission
                ? new Date(submission.submittedAt).toLocaleTimeString()
                : ""}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form Answers */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Your Responses
              </h3>
              {submission?.answers && submission.answers.length > 0 ? (
                submission.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {answer.fieldLabel}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getFieldTypeBadgeClass(
                            answer.fieldType
                          )}`}
                        >
                          {getFieldTypeBadgeLabel(answer.fieldType)}
                        </Badge>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <AnswerContent answer={answer} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No responses found
                </div>
              )}
            </div>

            {/* Privacy Consent Status */}
            <div className="border-t pt-6">
              <div
                className={`border rounded-lg p-4 ${
                  submission?.isChecked
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {submission?.isChecked ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Privacy Consent</span>
                    </h4>
                    <p
                      className={`text-sm ${
                        submission?.isChecked
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {submission?.isChecked
                        ? "You have granted consent for data processing"
                        : "Consent was not granted"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
