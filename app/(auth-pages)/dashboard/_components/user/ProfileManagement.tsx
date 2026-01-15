"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { User, Mail, Phone, Pencil, LogOut, Briefcase, Home, Lock, Upload, Archive, Calendar, FileText, Download, Folder, ChevronRight, ArchiveRestore, ChevronLeft, CreditCard, Building } from "lucide-react";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";
import { apiFetch } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import PasswordGuidelines from "@/components/PasswordGuidelines";
import ModernInfoCard from "@/components/profile/ModernInfoCard";
import PasswordRow from "@/components/profile/PasswordRow";
import MfaSetup from "@/app/_component/MfaSetup";
import { validatePasswordStrength } from "@/lib/password";
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
import { Button } from "@/components/ui/button";
import { s3 } from "@/lib/s3";
import { ManagedFile } from "@/types/files";
import { Loader } from "@/components/ui/loader";
import { ImageFitMode, isValidImageFitMode } from "@/types/ui";

type FileRecord = {
  id: string;
  url: string;
  path: string;
  name: string | null;
  size: string | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
  completedAt: string | null;
  folderName?: string | null;
  isArchived: boolean;
  file: globalThis.File;
};

type ProfileField = "contact" | "address" | "occupation" | "name" | "sinNumber" | "businessNumber" | "dateOfBirth";

// Deprecated local spinner; unified loader used below

// Error component to reduce complexity  
const ErrorDisplay = ({ error }: { error: string }) => (
  <div className="flex justify-center items-center h-screen">
    <div className="text-red-500 text-center">
      <h3 className="text-lg font-semibold">Error loading profile</h3>
      <p>{error}</p>
    </div>
  </div>
);

// Helper function to handle profile data updates
const useProfileUpdates = () => {
  const handleUpdate = async (
    field: ProfileField,
    profile: any,
    formValues: any,
    setSavingStates: React.Dispatch<React.SetStateAction<any>>,
    setProfile: React.Dispatch<React.SetStateAction<any>>,
    setEditStates: React.Dispatch<React.SetStateAction<any>>
  ) => {
    setSavingStates((prev: any) => ({ ...prev, [field]: true }));
    try {
      const payload = {
        ...profile,
        contactNumber: formValues.contactNumber,
        address: formValues.address,
        occupation: formValues.occupation,
        name: formValues.name,
        sinNumber: formValues.sinNumber,
        businessNumber: formValues.businessNumber,
        dateOfBirth: formValues.dateOfBirth ? new Date(formValues.dateOfBirth) : null,
      };
      
      const res = await apiFetch("/api/user/info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        logoutOn401: false,
      });
      
      if (!res.ok) {
        throw new Error(`Failed to update ${field.replace("Number", "")}`);
      }
      
      const data = await res.json();
      setProfile(data);
      setEditStates((prev: any) => ({ ...prev, [field]: false }));
      
      const fieldDisplayName = field.charAt(0).toUpperCase() + field.slice(1).replace("Number", "");
      toast.success(`${fieldDisplayName} updated`);
    } catch (err) {
      const error = await (err as any).json();
      toast.error(error.error || `Failed to update ${field.replace("Number", "")}`);
    } finally {
      setSavingStates((prev: any) => ({ ...prev, [field]: false }));
    }
  };

  return { handleUpdate };
};

// Helper function for password operations
const usePasswordOperations = () => {
  const validatePasswordInputs = (passwordValues: any) => {
    if (!passwordValues.currentPassword || !passwordValues.newPassword || !passwordValues.confirmPassword) {
      toast.error("Please fill in all password fields");
      return false;
    }

    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }

    if (passwordValues.currentPassword === passwordValues.newPassword) {
      toast.error("New password must be different from current password");
      return false;
    }

    const strength = validatePasswordStrength(passwordValues.newPassword);
    if (!strength.ok) {
      toast.error(strength.message || "Please create a stronger password");
      return false;
    }

    return true;
  };

  const sendPasswordOtp = async (profile: any, passwordValues: any, setSendingOtp: any, setOtpSent: any) => {
    setSendingOtp(true);
    try {
      const res = await apiFetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile?.email,
          purpose: "password-change",
          currentPassword: passwordValues.currentPassword,
          newPassword: passwordValues.newPassword,
        }),
        logoutOn401: false,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send OTP");
      }
      setOtpSent(true);
      toast.success("OTP sent to your email. Please enter the code below and click Confirm.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  return { validatePasswordInputs, sendPasswordOtp };
};

// Helper function for image operations
const useImageOperations = () => {
  const uploadImageToS3 = async (file: File, profileId: string) => {
    const filePath = s3.getUserProfilePicturePath(profileId, file.name);
    const signedUrlRes = await apiFetch("/api/s3/put", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filePath,
        contentType: file.type,
      }),
      logoutOn401: false,
    });

    if (!signedUrlRes.ok) throw new Error("Failed to get signed URL.");
    const { signedUrl } = await signedUrlRes.json();

    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) throw new Error("Failed to upload to S3.");
    return filePath;
  };

  const updateProfileUrl = async (filePath: string, profile: any) => {
    const updateUserRes = await apiFetch("/api/user/info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, profileUrl: filePath }),
      logoutOn401: false,
    });

    if (!updateUserRes.ok) throw new Error("Failed to update profile URL.");
    return await updateUserRes.json();
  };

  return { uploadImageToS3, updateProfileUrl };
};

// Helper function for archive operations
const useArchiveOperations = () => {
  const executeUnarchiveRequest = async (fileId: string) => {
    const res = await apiFetch(`/api/user/files/${fileId}/unarchive`, {
      method: "PATCH",
      logoutOn401: false,
    });
    if (!res.ok) {
      throw new Error("Failed to unarchive file.");
    }
  };

  const processRootLevelFile = (file: FileRecord, path: string, folders: Set<string>, files: FileRecord[]) => {
    if (path === "") {
      if (file.type === "folder" && file.name) {
        folders.add(file.name);
      } else if (file.type !== "folder") {
        files.push(file);
      }
    } else {
      const topLevelFolder = path.split("/")[0];
      if (topLevelFolder) {
        folders.add(topLevelFolder);
      }
    }
  };

  const processNestedFile = (file: FileRecord, path: string, currentPath: string, folders: Set<string>, files: FileRecord[]) => {
    if (path === currentPath) {
      if (file.type === "folder" && file.name) {
        folders.add(file.name);
      } else if (file.type !== "folder") {
        files.push(file);
      }
    } else if (path.startsWith(`${currentPath}/`)) {
      const remainingPath = path.substring(currentPath.length + 1);
      const nextLevelFolder = remainingPath.split("/")[0];
      if (nextLevelFolder) {
        folders.add(nextLevelFolder);
      }
    }
  };

  const organizeArchivedFiles = (filesList: FileRecord[], currentPath: string) => {
    const folders = new Set<string>();
    const files: FileRecord[] = [];

    for (const file of filesList) {
      const path = file.folderName || "";
      if (currentPath === "") {
        processRootLevelFile(file, path, folders, files);
      } else {
        processNestedFile(file, path, currentPath, folders, files);
      }
    }

    return { files, folders: Array.from(folders) };
  };

  return { executeUnarchiveRequest, organizeArchivedFiles };
};

// Helper component for image fit mode controls
const ImageFitModeControls = ({
  imageFitMode,
  onFitModeChange,
  profileId
}: {
  imageFitMode: ImageFitMode;
  onFitModeChange: (mode: ImageFitMode) => void;
  profileId?: string;
}) => {
  const handleModeChange = (mode: ImageFitMode) => {
    onFitModeChange(mode);
    try {
      if (profileId) localStorage.setItem(`profileImageFitMode:${profileId}`, mode);
      const evt = new CustomEvent('profile:image_fit_mode_updated', { detail: { mode } });
      globalThis.dispatchEvent(evt);
    } catch {}
  };

  return (
    <div className="mb-4">
      <div className="block text-sm font-medium text-gray-700 mb-2">
        Image Display Mode
      </div>
      <div className="flex gap-2">
        {['fit', 'fill', 'stretch'].map((mode) => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode as ImageFitMode)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              imageFitMode === mode
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {imageFitMode === 'fit' && 'Shows entire image, may have empty space'}
        {imageFitMode === 'fill' && 'Fills container, may crop image'}
        {imageFitMode === 'stretch' && 'Stretches to fill container, may distort'}
      </p>
    </div>
  );
};

// Helper component for profile image rendering
const ProfileImageRenderer = ({ 
  previewImageUrl, 
  profileImageUrl, 
  imageLoadError, 
  imageFitMode,
  profile,
  onImageLoadError,
  onImageLoad 
}: {
  previewImageUrl: string | null;
  profileImageUrl: string | null;
  imageLoadError: boolean;
  imageFitMode: ImageFitMode;
  profile: any;
  onImageLoadError: () => void;
  onImageLoad: () => void;
}) => {
  const getObjectFitClass = () => {
    switch (imageFitMode) {
      case 'fit':
        return 'object-contain';
      case 'fill':
        return 'object-cover';
      case 'stretch':
        return 'object-fill';
      default:
        return 'object-cover';
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Show preview image if available, otherwise show profile image
  const imageToShow = previewImageUrl || profileImageUrl;

  if (imageToShow && !imageLoadError) {
    return (
      <img
        src={imageToShow}
        alt="Profile"
        className={`w-full h-full ${getObjectFitClass()}`}
        onError={onImageLoadError}
        onLoad={onImageLoad}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="text-white text-2xl font-bold">
      {getUserInitials(profile?.name || "")}
    </span>
  );
};

// Reusable section header to reduce duplication across sections
const SectionHeader = ({
  icon: Icon,
  gradient,
  title,
}: {
  icon: React.ElementType;
  gradient: string;
  title: string;
}) => (
  <div className="flex items-center mb-6">
    <div className={`w-10 h-10 bg-gradient-to-r ${gradient} rounded-lg flex items-center justify-center mr-3`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
  </div>
);

//done
export default function ProfileManagement() {
  const router = useRouter();
  const profileUpdates = useProfileUpdates();
  const passwordOps = usePasswordOperations();
  const imageOps = useImageOperations();
  const archiveOps = useArchiveOperations();
  
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editStates, setEditStates] = useState({
    contact: false,
    address: false,
    occupation: false,
    name: false,
    sinNumber: false,
    businessNumber: false,
    dateOfBirth: false,
  });

  const [formValues, setFormValues] = useState({
    contactNumber: "",
    address: "",
    occupation: "",
    name: "",
    sinNumber: "",
    businessNumber: "",
    dateOfBirth: "",
  });

  const [savingStates, setSavingStates] = useState({
    contact: false,
    address: false,
    occupation: false,
    name: false,
    sinNumber: false,
    businessNumber: false,
    dateOfBirth: false,
  });

  const [passwordValues, setPasswordValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    otp: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordHelp, setShowPasswordHelp] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageFitMode, setImageFitMode] = useState<ImageFitMode>('fit');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Archive related state
  const [archivedFilesList, setArchivedFilesList] = useState<FileRecord[]>([]);
  const [currentArchivePath, setCurrentArchivePath] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const res = await apiFetch("/api/user/info", { logoutOn401: false });
      if (res.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setFormValues(createFormValuesFromProfile(data));
    } catch (err: any) {
      setProfileError(err.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const formatDateForInput = (dateValue?: string | Date | null) => {
    if (!dateValue) return "";
    try {
      const d = new Date(dateValue);
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const fetchArchivedFiles = async () => {
    setArchiveLoading(true);
    try {
      const res = await apiFetch("/api/user/archived-files", { logoutOn401: false });
      if (res.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch archived files");
      const data = await res.json();
      setArchivedFilesList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching archived files:", error);
      setArchivedFilesList([]);
      toast.error("Failed to load archived files");
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchProfile(), fetchArchivedFiles()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchArchivedFiles();
  }, []);

  useEffect(() => {
    if (profile?.profileImageUrl) {
      setProfileImageUrl(profile.profileImageUrl);
      setImageLoadError(false);
    } else if (profile?.profileUrl?.startsWith('https://')) {
      // Fallback to profileUrl if profileImageUrl is not available but profileUrl is a valid URL
      setProfileImageUrl(profile.profileUrl);
      setImageLoadError(false);
    } else {
      setProfileImageUrl(null);
      setImageLoadError(false);
    }
    // Load persisted image fit mode for this user
    try {
      const userId = profile?.id;
      if (userId) {
        const persisted = localStorage.getItem(`profileImageFitMode:${userId}`);
        if (persisted && isValidImageFitMode(persisted)) {
          setImageFitMode(persisted);
        }
      }
    } catch {}
  }, [profile]);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const createFormValuesFromProfile = (profileData: any) => ({
    contactNumber: profileData.contactNumber || "",
    address: profileData.address || "",
    occupation: profileData.occupation || "",
    name: profileData.name || "",
    sinNumber: profileData.sinNumber || "",
    businessNumber: profileData.businessNumber || "",
    dateOfBirth: formatDateForInput(profileData.dateOfBirth),
  });

  const handleUpdate = async (
    field: ProfileField
  ) => {
    await profileUpdates.handleUpdate(field, profile, formValues, setSavingStates, setProfile, setEditStates);
  };

  const resetFormState = () => {
    setFormValues(createFormValuesFromProfile(profile));
  };

  const handleEditToggle = (
    field:
      | "contact"
      | "address"
      | "occupation"
      | "name"
      | "sinNumber"
      | "businessNumber"
      | "dateOfBirth",
    isEditing: boolean
  ) => {
    setEditStates((prev) => ({ ...prev, [field]: isEditing }));
    if (!isEditing) {
      resetFormState();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPasswordValues((prev) => ({ ...prev, [name]: value }));
  };

  const sendPasswordOtpHandler = async () => {
    await passwordOps.sendPasswordOtp(profile, passwordValues, setSendingOtp, setOtpSent);
  };

  const changePasswordWithOtp = async () => {
    setPasswordSaving(true);
    try {
      const res = await apiFetch("/api/user/change-password-with-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordValues.currentPassword,
          newPassword: passwordValues.newPassword,
          otp: passwordValues.otp,
        }),
        logoutOn401: false,
      });

      if (res.status === 401) {
        const { signOut } = await import("next-auth/react");
        signOut();
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to change password");
      }
      toast.success("Password changed successfully!");
      setPasswordValues({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        otp: "",
      });
      setShowPassword(false);
      setOtpSent(false);
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setPasswordSaving(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordValues({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      otp: "",
    });
    setShowPassword(false);
    setOtpSent(false);
  };

  const handleSavePassword = async () => {
    if (!passwordOps.validatePasswordInputs(passwordValues)) return;

    if (!otpSent) {
      await sendPasswordOtpHandler();
      return;
    }

    if (!passwordValues.otp) {
      toast.error("Please enter the OTP code");
      return;
    }

    await changePasswordWithOtp();
  };


  const handleProfileImageUpload = async () => {
    if (!profileImageFile) return;
    setProfileImageUploading(true);

    try {
      const filePath = await imageOps.uploadImageToS3(profileImageFile, profile.id);
      const updatedProfile = await imageOps.updateProfileUrl(filePath, profile);
      setProfile(updatedProfile);
      try {
        const event = new CustomEvent('profile:image_updated', { detail: { url: updatedProfile?.profileImageUrl || updatedProfile?.profileUrl } });
        globalThis.dispatchEvent(event);
      } catch {}
      setProfileImageFile(null);
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setProfileImageUploading(false);
    }
  };

  const handleUnarchiveFile = async (fileId: string) => {
    const fileToMove = archivedFilesList.find((f) => f.id === fileId);
    if (!fileToMove) return;

    // Optimistic UI update
    setArchivedFilesList((prev) => prev.filter((f) => f.id !== fileId));
    toast.success("File unarchived.");

    try {
      await archiveOps.executeUnarchiveRequest(fileId);
      // Refresh archived files to ensure consistency
      await fetchArchivedFiles();
    } catch (error) {
      console.error("Failed to unarchive file:", error);
      toast.error("Failed to unarchive file. Please try again.");
      setArchivedFilesList((prev) => [...prev, fileToMove]);
    }
  };

  // Helper functions to reduce cognitive complexity
  const { files: displayedArchivedFiles, folders: displayedArchivedFolders } =
    useMemo(() => {
      return archiveOps.organizeArchivedFiles(archivedFilesList, currentArchivePath);
    }, [archivedFilesList, currentArchivePath]);

  const managedArchivedFiles: ManagedFile[] = displayedArchivedFiles.map(
    (file) => ({
      id: file.id,
      name: file.name || "Unnamed File",
      url: file.url,
      size: file.size,
      createdAt: file.createdAt,
      folderName: file.folderName,
    })
  );

  const handleImageLoadError = () => {
    // Only log error if it's not a Google profile image, as they can have CORS or expiry issues
    if (profileImageUrl && !profileImageUrl.includes('googleusercontent.com')) {
      console.error("Failed to load profile image:", profileImageUrl);
      toast.error(
        "Unable to load profile image. The file format may not be supported."
      );
    } else if (profileImageUrl?.includes('googleusercontent.com')) {
      // For Google images, show a subtle notification that the image couldn't load
      console.warn("Google profile image failed to load, falling back to initials");
    }
    setImageLoadError(true);
  };

  const handleImageLoad = () => {
    setImageLoadError(false);
  };

  if (profileLoading) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <Loader size={48} className="text-emerald-600 mb-3" />
          <div className="text-sm text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return <ErrorDisplay error={profileError} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br bg-transparent p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Profile Management
            </h2>
          </div>
          
          {/* Right-side header profile summary removed */}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
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
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden">
                <ProfileImageRenderer
                  previewImageUrl={previewImageUrl}
                  profileImageUrl={profileImageUrl}
                  imageLoadError={imageLoadError}
                  imageFitMode={imageFitMode}
                  profile={profile}
                  onImageLoadError={handleImageLoadError}
                  onImageLoad={handleImageLoad}
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                disabled={profileImageUploading}
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const supportedFormats = [
                      "image/jpeg",
                      "image/jpg",
                      "image/png",
                      "image/webp",
                      "image/gif",
                    ];
                    if (supportedFormats.includes(file.type)) {
                      setProfileImageFile(file);
                      // Create preview URL for immediate display
                      const previewUrl = URL.createObjectURL(file);
                      setPreviewImageUrl(previewUrl);
                    } else {
                      toast.error(
                        "Please upload a supported image format (JPG, PNG, WebP, GIF)"
                      );
                      e.target.value = "";
                    }
                  } else {
                    setProfileImageFile(null);
                    setPreviewImageUrl(null);
                  }
                }}
                disabled={profileImageUploading}
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {profile?.name || "Unknown User"}
              </h1>
              <p className="text-gray-600 mb-2">
                {formValues.occupation || "User Profile"}
              </p>
              <div className="flex items-center justify-center md:justify-start text-sm text-gray-500 mb-4">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Active since{" "}
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })
                  : "-"}
              </div>

              {profileImageFile && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Selected: {profileImageFile.name}
                  </div>
                  
                  {/* Image Fit Mode Controls */}
                  <ImageFitModeControls
                    imageFitMode={imageFitMode}
                    onFitModeChange={setImageFitMode}
                    profileId={profile?.id}
                  />
                  
                  <div className="flex justify-center md:justify-start gap-2">
                    <Button
                      onClick={handleProfileImageUpload}
                      disabled={profileImageUploading}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {profileImageUploading ? "Uploading..." : "Upload"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProfileImageFile(null);
                        if (previewImageUrl) {
                          URL.revokeObjectURL(previewImageUrl);
                          setPreviewImageUrl(null);
                        }
                      }}
                      disabled={profileImageUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Profile Button */}
            <Button
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-2 rounded-xl shadow-lg"
              onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <SectionHeader icon={User} gradient="from-blue-500 to-blue-600" title="Personal Information" />

          <div className="space-y-6">
            <ModernInfoCard
              icon={User}
              iconGradient="from-blue-500 to-blue-600"
              label="FULL NAME"
              value={formValues.name}
              isEditing={editStates.name}
              onEditToggle={(isEditing) => handleEditToggle("name", isEditing)}
              onSave={() => handleUpdate("name")}
              onChange={handleInputChange}
              name="name"
              isSaving={savingStates.name}
              placeholder="John Doe"
            />

            <ModernInfoCard
              icon={Calendar}
              iconGradient="from-indigo-500 to-indigo-600"
              label="DATE OF BIRTH"
              value={formValues.dateOfBirth}
              isEditing={editStates.dateOfBirth}
              onEditToggle={(isEditing) =>
                handleEditToggle("dateOfBirth", isEditing)
              }
              onSave={() => handleUpdate("dateOfBirth")}
              onChange={handleInputChange}
              name="dateOfBirth"
              isSaving={savingStates.dateOfBirth}
              placeholder="1990-01-01"
              inputType="date"
            />

            <ModernInfoCard
              icon={Briefcase}
              iconGradient="from-purple-500 to-purple-600"
              label="OCCUPATION"
              value={formValues.occupation}
              isEditing={editStates.occupation}
              onEditToggle={(isEditing) =>
                handleEditToggle("occupation", isEditing)
              }
              onSave={() => handleUpdate("occupation")}
              onChange={handleInputChange}
              name="occupation"
              isSaving={savingStates.occupation}
              placeholder="Product Designer"
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <SectionHeader icon={Mail} gradient="from-green-500 to-teal-600" title="Contact Information" />

          <div className="space-y-6">
            <ModernInfoCard
              icon={Mail}
              iconGradient="from-blue-500 to-blue-600"
              label="EMAIL ADDRESS"
              value={profile?.email || ""}
              isEditing={false}
            />

            {/* Commented out for future use */}
            {/* <ModernInfoCard
              icon={Globe}
              iconGradient="from-cyan-500 to-cyan-600"
              label="WEBSITE"
              value={profile?.website || "www.alexjohnson.dev"}
              isEditing={false}
            /> */}

            <ModernInfoCard
              icon={Phone}
              iconGradient="from-green-500 to-green-600"
              label="PHONE NUMBER"
              value={formValues.contactNumber}
              isEditing={editStates.contact}
              onEditToggle={(isEditing) =>
                handleEditToggle("contact", isEditing)
              }
              onSave={() => handleUpdate("contact")}
              onChange={handleInputChange}
              name="contactNumber"
              isSaving={savingStates.contact}
              placeholder="+1 (555) 123-4567"
            />

            <ModernInfoCard
              icon={Home}
              iconGradient="from-red-500 to-pink-600"
              label="ADDRESS"
              value={formValues.address}
              isEditing={editStates.address}
              onEditToggle={(isEditing) =>
                handleEditToggle("address", isEditing)
              }
              onSave={() => handleUpdate("address")}
              onChange={handleInputChange}
              name="address"
              isSaving={savingStates.address}
              placeholder="123 Main Street, San Francisco, CA 94105"
            />
          </div>
        </div>

        {/* Business Information Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <SectionHeader icon={Building} gradient="from-purple-500 to-indigo-600" title="Business Information" />

          <div className="space-y-6">
            <ModernInfoCard
              icon={CreditCard}
              iconGradient="from-purple-500 to-purple-600"
              label="SIN NUMBER"
              value={formValues.sinNumber}
              isEditing={editStates.sinNumber}
              onEditToggle={(isEditing) =>
                handleEditToggle("sinNumber", isEditing)
              }
              onSave={() => handleUpdate("sinNumber")}
              onChange={handleInputChange}
              name="sinNumber"
              isSaving={savingStates.sinNumber}
              placeholder="123-456-789"
            />

            <ModernInfoCard
              icon={Building}
              iconGradient="from-indigo-500 to-indigo-600"
              label="BUSINESS NUMBER"
              value={formValues.businessNumber}
              isEditing={editStates.businessNumber}
              onEditToggle={(isEditing) =>
                handleEditToggle("businessNumber", isEditing)
              }
              onSave={() => handleUpdate("businessNumber")}
              onChange={handleInputChange}
              name="businessNumber"
              isSaving={savingStates.businessNumber}
              placeholder="123456789RT0001"
            />
          </div>
        </div>

        {/* Archive Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <SectionHeader icon={Archive} gradient="from-orange-500 to-red-600" title="Document Archive" />

          <ProfileArchiveViewer
            files={managedArchivedFiles}
            folders={displayedArchivedFolders}
            isLoading={archiveLoading}
            currentPath={currentArchivePath}
            onPathChange={setCurrentArchivePath}
            onFileUnarchive={handleUnarchiveFile}
          />
        </div>

        {profile?.provider === "credentials" && (
          <>
            {/* Security Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <SectionHeader icon={Lock} gradient="from-gray-600 to-gray-800" title="Security" />

              {showPassword ? (
                <div className="space-y-6">
                  <PasswordRow
                    label="Current Password"
                    name="currentPassword"
                    value={passwordValues.currentPassword}
                    onChange={handlePasswordInputChange}
                    isSaving={passwordSaving}
                  />
                  <PasswordRow
                    label="New Password"
                    name="newPassword"
                    value={passwordValues.newPassword}
                    onChange={handlePasswordInputChange}
                    onFocus={() => setShowPasswordHelp(true)}
                    onBlur={() => setShowPasswordHelp(false)}
                    isSaving={passwordSaving}
                  />
                  <PasswordGuidelines
                    visible={showPasswordHelp}
                    password={passwordValues.newPassword}
                  />
                  <PasswordRow
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={passwordValues.confirmPassword}
                    onChange={handlePasswordInputChange}
                    isSaving={passwordSaving || sendingOtp}
                  />

                  {/* OTP Section - only show after OTP is sent */}
                  {otpSent && (
                    <div className="border-t pt-6">
                      <div className="text-sm font-medium text-gray-700 mb-4">
                        Enter Verification Code
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        We've sent a 6-digit code to {profile?.email}
                      </div>
                      <div className="space-y-4">
                        <input
                          type="text"
                          name="otp"
                          placeholder="Enter 6-digit code"
                          value={passwordValues.otp}
                          onChange={handlePasswordInputChange}
                          disabled={passwordSaving}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-center text-lg tracking-widest"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={resetPasswordForm}
                      disabled={passwordSaving || sendingOtp}
                    >
                      Cancel
                    </Button>
                    {otpSent ? (
                      <Button
                        onClick={handleSavePassword}
                        disabled={passwordSaving || !passwordValues.otp}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                      >
                        {passwordSaving ? "Confirming..." : "Confirm"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSavePassword}
                        disabled={
                          passwordSaving ||
                          sendingOtp ||
                          !passwordValues.currentPassword ||
                          !passwordValues.newPassword ||
                          !passwordValues.confirmPassword
                        }
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      >
                        {sendingOtp ? "Sending OTP..." : "Save Password"}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center mr-4">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wide">
                        PASSWORD
                      </div>
                      <div className="font-medium text-gray-800">
                        ••••••••••
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowPassword(true)}
                    className="bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white self-center sm:self-auto mt-3 sm:mt-0"
                  >
                    Change Password
                  </Button>
                </div>
              )}
            </div>

            {/* MFA Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <MfaSetup />
            </div>
          </>
        )}

        {/* Sign Out Button */}
        <div className="text-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-xl shadow-lg text-lg">
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will sign you out of your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await signOut({ redirect: false });
                    router.push("/login");
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Sign Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

interface ProfileArchiveViewerProps {
  files: ManagedFile[];
  folders: string[];
  isLoading: boolean;
  currentPath: string;
  onPathChange: (path: string) => void;
  onFileUnarchive: (fileId: string) => void;
}

const ProfileArchiveViewer: React.FC<ProfileArchiveViewerProps> = ({
  files,
  folders,
  isLoading,
  currentPath,
  onPathChange,
  onFileUnarchive,
}) => {
  const handleFolderClick = (folderName: string) => {
    onPathChange(currentPath ? `${currentPath}/${folderName}` : folderName);
  };

  const handleBackClick = () => {
    const pathParts = currentPath.split("/");
    pathParts.pop();
    onPathChange(pathParts.join("/"));
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm">
        <button
          onClick={() => onPathChange("")}
          className="text-orange-600 hover:text-orange-700 font-medium"
        >
          Archive Root
        </button>
        {currentPath
          .split("/")
          .filter(Boolean)
          .map((part, index, arr) => {
            const path = arr.slice(0, index + 1).join("/");
            return (
              <React.Fragment key={path}>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => onPathChange(path)}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
      </div>

      {currentPath && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackClick}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Folders
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => handleFolderClick(folder)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleFolderClick(folder);
                      }
                    }}
                    className="flex flex-col items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl cursor-pointer hover:from-orange-100 hover:to-red-100 transition-all duration-200 border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
                    aria-label={`Open folder ${folder}`}
                  >
                    <Folder className="w-8 h-8 text-orange-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 truncate w-full text-center">
                      {folder}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Files
              </h4>
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl border border-gray-200 hover:border-orange-300 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {file.name}
                        </p>
                        {file.size && file.createdAt && (
                          <p className="text-sm text-gray-500 truncate">
                            {file.size} • Archived on{" "}
                            {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        asChild
                      >
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFileUnarchive(file.id)}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <ArchiveRestore className="w-4 h-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length === 0 && folders.length === 0 && (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No archived files
              </h3>
              <p className="text-sm text-gray-500">
                {currentPath
                  ? "This folder is empty"
                  : "You haven't archived any files yet"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Local duplicated components removed in favor of shared ones
