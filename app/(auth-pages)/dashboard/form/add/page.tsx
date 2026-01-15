"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import FormBuilder from "../_components/FormBuilder";
import DashboardHeader from "../../_components/admin/DashboardHeader";

export default function AddFormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

    setLoading(false);
  }, [session, status, router]);

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

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-cyan-50 pt-24">
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#007399] h-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Page Header */}
          <div className="bg-white shadow-sm border rounded-lg mb-6">
            <div className="px-6 py-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Add New Form
              </h1>
            </div>
          </div>
          {/* Loading Content */}
          <div className="bg-white shadow-sm border rounded-lg">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center">
                <Loader size={32} className="mb-3 text-blue-500" />
                <p className="text-gray-600">Loading form builder...</p>
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

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cyan-50 pt-24">
          <div className="fixed top-0 left-0 right-0 z-50 bg-[#007399] h-20" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-white shadow-sm border rounded-lg">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center">
                  <Loader size={32} className="mb-3 text-blue-500" />
                  <p className="text-gray-600">Loading form builder...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-cyan-50 pt-30">
        <DashboardHeader
          activeTab="forms"
          onTabChange={handleTabChange}
          onLogout={handleLogout}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Form Builder Content */}
          <div className="bg-white shadow-sm border rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                  Add New Form
                </h1>
                {/* <button
                  onClick={() => router.push("/dashboard?tab=forms")}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  ← Back to Forms
                </button> */}
              </div>
            </div>
            <div className="p-6">
              <FormBuilder mode="create" />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
