"use client";
import { useState, useEffect } from "react";
import { signOut} from "next-auth/react";
import { apiFetch } from "@/lib/client-api";
import { useRouter, useSearchParams } from "next/navigation";
import BlogManagement from "./BlogManagement";
import TestimonialsManagement from "./TestimonialsManagement";
import OpenContactsManagement from "./OpenContactsManagement";
import FormsManagement from "./FormsManagement";
import NotificationManagement from "./NotificationManagement";
import FileManagement from "./FileManagement";
import DashboardHeader from "./DashboardHeader";
import ProfileManagement from "./ProfileManagement";
import UserManagement from "./UserManagement";
import useHeartbeat from "@/hooks/use-heartbeat";

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    | "users"
    | "files"
    | "notifications"
    | "blogs"
    | "testimonials"
    | "contacts"
    | "forms"
    | "profile"
  >("users");

  // Check for tab parameter in URL and set active tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "users",
        "files",
        "notifications",
        "blogs",
        "testimonials",
        "contacts",
        "forms",
        "profile",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Loading and error states
  const [notifications, setNotifications] = useState<any[]>([]);


  // Initialize heartbeat for online status tracking
  useHeartbeat();

  const [blogsReloadKey, setBlogsReloadKey] = useState(0);
  const [testimonialsReloadKey, setTestimonialsReloadKey] = useState(0);
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  const [contactsReloadKey, setContactsReloadKey] = useState(0);
  const [formsReloadKey, setFormsReloadKey] = useState(0);
  const [blogsSpinning, setBlogsSpinning] = useState(false);
  const [testimonialsSpinning, setTestimonialsSpinning] = useState(false);
  const [contactsSpinning, setContactsSpinning] = useState(false);
  const [formsSpinning, setFormsSpinning] = useState(false);
  const [profileSpinning, setProfileSpinning] = useState(false);

  // Fetch notifications on mount for header count
  useEffect(() => {
    apiFetch("/api/admin/notification", { logoutOn401: false })
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to fetch notifications"))
      )
      .then((notificationsData) => {
        setNotifications(notificationsData);
      })
      .catch(() => {
        // We intentionally don't set global error here to avoid blocking users UI
      });
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  // Reload handler for Blogs tab
  const handleReloadBlogs = () => {
    setBlogsSpinning(true);
    setBlogsReloadKey((k) => k + 1);
    setTimeout(() => setBlogsSpinning(false), 700);
  };

  // Reload handler for Testimonials tab
  const handleReloadTestimonials = () => {
    setTestimonialsSpinning(true);
    setTestimonialsReloadKey((k) => k + 1);
    setTimeout(() => setTestimonialsSpinning(false), 700);
  };

  // Reload handler for Site Settings (Profile) tab
  const handleReloadProfile = () => {
    setProfileSpinning(true);
    setProfileReloadKey((k) => k + 1);
    setTimeout(() => setProfileSpinning(false), 700);
  };

  // Reload handler for Site Settings (Contacts) tab
  const handleReloadContacts = () => {
    setContactsSpinning(true);
    setContactsReloadKey((k) => k + 1);
    setTimeout(() => setContactsSpinning(false), 700);
  };

  // Reload handler for Forms tab
  const handleReloadForms = () => {
    setFormsSpinning(true);
    setFormsReloadKey((k) => k + 1);
    setTimeout(() => setFormsSpinning(false), 700);
  };

  return (
    <div className="min-h-screen bg-cyan-50">
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        onLogout={handleLogout}
        unreadNotificationsCount={
          notifications.filter((n: any) => !n.isRead).length
        }
      />
      <div className="w-full sm:px-0 lg:px-6 py-8 pt-24">
        {activeTab === "users" && <UserManagement />}
        {activeTab === "files" && <FileManagement />}
        {activeTab === "notifications" && <NotificationManagement />}
        {activeTab === "blogs" && (
          <>
            <div className="flex justify-end px-4 pb-4">
              <button
                onClick={handleReloadBlogs}
                className="inline-flex items-center rounded-md bg-cyan-600 p-2 text-white shadow hover:bg-cyan-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-5 w-5 ${blogsSpinning ? "animate-spin" : ""}`}
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-3.51-7.07" />
                  <polyline points="22 3 21 7 17 6" />
                </svg>
              </button>
            </div>
            <BlogManagement key={blogsReloadKey} />
          </>
        )}
        {activeTab === "testimonials" && (
          <>
            <div className="flex justify-end px-4 pb-4">
              <button
                onClick={handleReloadTestimonials}
                className="inline-flex items-center rounded-md bg-cyan-600 p-2 text-white shadow hover:bg-cyan-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-5 w-5 ${testimonialsSpinning ? "animate-spin" : ""}`}
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-3.51-7.07" />
                  <polyline points="22 3 21 7 17 6" />
                </svg>
              </button>
            </div>
            <TestimonialsManagement key={testimonialsReloadKey} />
          </>
        )}
        {activeTab === "contacts" && (
          <>
            <div className="flex justify-end px-4 pb-4">
              <button
                onClick={handleReloadContacts}
                className="inline-flex items-center rounded-md bg-cyan-600 p-2 text-white shadow hover:bg-cyan-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-5 w-5 ${contactsSpinning ? "animate-spin" : ""}`}
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-3.51-7.07" />
                  <polyline points="22 3 21 7 17 6" />
                </svg>
              </button>
            </div>
            <OpenContactsManagement key={contactsReloadKey} />
          </>
        )}
        {activeTab === "forms" && (
          <>
            <div className="flex justify-end px-4 pb-4">
              <button
                onClick={handleReloadForms}
                className="inline-flex items-center rounded-md bg-cyan-600 p-2 text-white shadow hover:bg-cyan-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-5 w-5 ${formsSpinning ? "animate-spin" : ""}`}
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-3.51-7.07" />
                  <polyline points="22 3 21 7 17 6" />
                </svg>
              </button>
            </div>
            <FormsManagement key={formsReloadKey} />
          </>
        )}
        {activeTab === "profile" && (
          <>
            <div className="flex justify-end px-4 pb-4">
              <button
                onClick={handleReloadProfile}
                className="inline-flex items-center rounded-md bg-cyan-600 p-2 text-white shadow hover:bg-cyan-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-5 w-5 ${profileSpinning ? "animate-spin" : ""}`}
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-3.51-7.07" />
                  <polyline points="22 3 21 7 17 6" />
                </svg>
              </button>
            </div>
            <ProfileManagement key={profileReloadKey} />
          </>
        )}
      </div>
    </div>
  );
}
