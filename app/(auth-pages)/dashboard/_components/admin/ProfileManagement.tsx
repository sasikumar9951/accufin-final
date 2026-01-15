"use client";
import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Pencil, LogOut, Briefcase, Home, Lock, Upload, Calendar, CreditCard, Building } from "lucide-react";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import PasswordGuidelines from "@/components/PasswordGuidelines";
import ModernInfoCard from "@/components/profile/ModernInfoCard";
import PasswordRow from "@/components/profile/PasswordRow";
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
import MfaSetup from "@/app/_component/MfaSetup";
import { Loader } from "@/components/ui/loader";
import { ImageFitMode, isValidImageFitMode } from "@/types/ui";

// Type definitions for better code quality
type ProfileField = "contact" | "address" | "occupation" | "name" | "sinNumber" | "businessNumber" | "dateOfBirth";

// Helper functions to reduce cognitive complexity
const validatePasswordFields = (passwordValues: any) => {
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

const sendOtpForPasswordChange = async (profile: any, passwordValues: any, setSendingOtp: any, setOtpSent: any) => {
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

const changePasswordWithOtp = async (passwordValues: any, setPasswordSaving: any, setPasswordValues: any, setShowPassword: any, setOtpSent: any) => {
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

// Helper function for profile image upload
const uploadProfileImage = async (
  profileImageFile: File,
  profile: any,
  setProfile: any,
  setProfileImageFile: any,
  setProfileImageUploading: any
) => {
  setProfileImageUploading(true);

  try {
    const filePath = s3.getUserProfilePicturePath(profile.id, profileImageFile.name);
    const signedUrlRes = await apiFetch("/api/s3/put", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filePath,
        contentType: profileImageFile.type,
      }),
      logoutOn401: false,
    });

    if (!signedUrlRes.ok) throw new Error("Failed to get signed URL.");
    const { signedUrl } = await signedUrlRes.json();

    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: profileImageFile,
      headers: { "Content-Type": profileImageFile.type },
    });

    if (!uploadRes.ok) throw new Error("Failed to upload to S3.");

    const updateUserRes = await apiFetch("/api/user/info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, profileUrl: filePath }),
      logoutOn401: false,
    });

    if (!updateUserRes.ok) throw new Error("Failed to update profile URL.");

    const updatedProfile = await updateUserRes.json();
    setProfile(updatedProfile);
    try {
      const event = new CustomEvent('profile:image_updated', { 
        detail: { url: updatedProfile?.profileImageUrl || updatedProfile?.profileUrl } 
      });
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

// Helper function for image fit mode handling
const handleImageFitModeChange = (
  mode: ImageFitMode,
  setImageFitMode: any,
  profileId?: string
) => {
  setImageFitMode(mode);
  try {
    if (profileId) localStorage.setItem(`profileImageFitMode:${profileId}`, mode);
    const evt = new CustomEvent('profile:image_fit_mode_updated', { detail: { mode } });
    globalThis.dispatchEvent(evt);
  } catch {}
};

// Helper function for file input handling
const handleFileInputChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setProfileImageFile: any,
  setPreviewImageUrl: any
) => {
  const file = event.target.files?.[0];
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
      event.target.value = "";
    }
  } else {
    setProfileImageFile(null);
    setPreviewImageUrl(null);
  }
};

// Helper function for canceling image upload
const handleCancelImageUpload = (
  setProfileImageFile: any,
  previewImageUrl: string | null,
  setPreviewImageUrl: any
) => {
  setProfileImageFile(null);
  if (previewImageUrl) {
    URL.revokeObjectURL(previewImageUrl);
    setPreviewImageUrl(null);
  }
};

// Helper function for password form reset
const resetPasswordForm = (
  setShowPassword: any,
  setOtpSent: any,
  setPasswordValues: any
) => {
  setShowPassword(false);
  setOtpSent(false);
  setPasswordValues({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    otp: "",
  });
};

// Helper function for profile image error handling
const handleProfileImageError = (profileImageUrl: string | null, setImageLoadError: any) => {
  // Only log error if it's not a Google profile image, as they can have CORS or expiry issues
  if (profileImageUrl && !profileImageUrl.includes('googleusercontent.com')) {
    console.error("Failed to load profile image:", profileImageUrl);
    toast.error("Unable to load profile image. The file format may not be supported.");
  }
  setImageLoadError(true);
};

// Helper function for initializing component state
const initializeProfileState = (profile: any, setImageLoadError: any, setProfileImageUrl: any, setImageFitMode: any) => {
  if (profile?.profileImageUrl) {
    setProfileImageUrl(profile.profileImageUrl);
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
};

// Helper component to reduce cognitive complexity
const ProfileAvatar: React.FC<{
  profileImageUrl: string | null;
  imageLoadError: boolean;
  userName: string;
  onImageError: () => void;
  onImageLoad: () => void;
  fitMode?: ImageFitMode;
  previewImageUrl?: string | null;
}> = ({ profileImageUrl, imageLoadError, userName, onImageError, onImageLoad, fitMode = 'fit', previewImageUrl }) => {
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getObjectFitClass = () => {
    switch (fitMode) {
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

  // Show preview image if available, otherwise show profile image
  const imageToShow = previewImageUrl || profileImageUrl;

  if (imageToShow && !imageLoadError) {
    return (
      <img
        src={imageToShow}
        alt="Profile"
        className={`w-full h-full ${getObjectFitClass()}`}
        onError={onImageError}
        onLoad={onImageLoad}
      />
    );
  }

  if (imageToShow && imageLoadError) {
    return (
      <span className="text-white text-2xl font-bold">
        {getUserInitials(userName)}
      </span>
    );
  }

  return (
    <span className="text-white text-2xl font-bold">
      {getUserInitials(userName)}
    </span>
  );
};

export default function ProfileManagement() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Shared helpers to reduce duplication
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

  const mapProfileToFormValues = (p: any) => ({
    contactNumber: p?.contactNumber || "",
    address: p?.address || "",
    occupation: p?.occupation || "",
    name: p?.name || "",
    sinNumber: p?.sinNumber || "",
    businessNumber: p?.businessNumber || "",
    dateOfBirth: formatDateForInput(p?.dateOfBirth),
  });

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

  // Reduce cognitive complexity with simple boolean check
  const isCredentialProvider = profile?.provider === "credentials";

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
        const res = await apiFetch("/api/user/info", { logoutOn401: false });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setFormValues(mapProfileToFormValues(data));
    } catch (err: any) {
      setProfileError(err.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    initializeProfileState(profile, setImageLoadError, setProfileImageUrl, setImageFitMode);
  }, [profile]);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const handleUpdate = async (field: ProfileField) => {
    setSavingStates((prev) => ({ ...prev, [field]: true }));
    try {
      const payload = {
        ...profile,
        contactNumber: formValues.contactNumber,
        address: formValues.address,
        occupation: formValues.occupation,
        name: formValues.name,
        sinNumber: formValues.sinNumber,
        businessNumber: formValues.businessNumber,
        dateOfBirth: formValues.dateOfBirth
          ? new Date(formValues.dateOfBirth)
          : null,
      };
      const res = await apiFetch("/api/user/info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        logoutOn401: false,
      });
      if (!res.ok)
        throw new Error(`Failed to update ${field.replace("Number", "")}`);
      const data = await res.json();
      setProfile(data);
      setEditStates((prev) => ({ ...prev, [field]: false }));
      toast.success(
        `${
          field.charAt(0).toUpperCase() + field.slice(1).replace("Number", "")
        } updated`
      );
    } catch (err) {
      const error = await (err as any).json();
      toast.error(
        error.error || `Failed to update ${field.replace("Number", "")}`
      );
    } finally {
      setSavingStates((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleEditToggle = (field: ProfileField, isEditing: boolean) => {
    setEditStates((prev) => ({ ...prev, [field]: isEditing }));
    if (!isEditing) {
      setFormValues(mapProfileToFormValues(profile));
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

  const handleSavePassword = async () => {
    // Step 1: Validate password fields
    if (!validatePasswordFields(passwordValues)) return;

    // Step 2: If OTP not sent yet, send OTP
    if (!otpSent) {
      await sendOtpForPasswordChange(profile, passwordValues, setSendingOtp, setOtpSent);
      return;
    }

    // Step 3: If OTP sent but not entered, show error
    if (otpSent && !passwordValues.otp) {
      toast.error("Please enter the OTP code");
      return;
    }

    // Step 4: Change password with OTP
    await changePasswordWithOtp(passwordValues, setPasswordSaving, setPasswordValues, setShowPassword, setOtpSent);
  };

  const handleProfileImageUpload = async () => {
    if (!profileImageFile) return;
    await uploadProfileImage(profileImageFile, profile, setProfile, setProfileImageFile, setProfileImageUploading);
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
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold">Error loading profile</h3>
          <p>{profileError}</p>
        </div>
      </div>
    );
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
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden">
                <ProfileAvatar
                  profileImageUrl={profileImageUrl}
                  imageLoadError={imageLoadError}
                  userName={profile?.name || ""}
                  onImageError={() => handleProfileImageError(profileImageUrl, setImageLoadError)}
                  onImageLoad={() => setImageLoadError(false)}
                  fitMode={imageFitMode}
                  previewImageUrl={previewImageUrl}
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
                onChange={(e) => handleFileInputChange(e, setProfileImageFile, setPreviewImageUrl)}
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
                {formValues.occupation || "Admin Profile"}
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
                  <div className="mb-4">
                    <div className="block text-sm font-medium text-gray-700 mb-2">
                      Image Display Mode
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleImageFitModeChange('fit', setImageFitMode, profile?.id)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          imageFitMode === 'fit'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Fit
                      </button>
                      <button
                        onClick={() => handleImageFitModeChange('fill', setImageFitMode, profile?.id)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          imageFitMode === 'fill'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Fill
                      </button>
                      <button
                        onClick={() => handleImageFitModeChange('stretch', setImageFitMode, profile?.id)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          imageFitMode === 'stretch'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Stretch
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {imageFitMode === 'fit' && 'Shows entire image, may have empty space'}
                      {imageFitMode === 'fill' && 'Fills container, may crop image'}
                      {imageFitMode === 'stretch' && 'Stretches to fill container, may distort'}
                    </p>
                  </div>
                  
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
                      onClick={() => handleCancelImageUpload(setProfileImageFile, previewImageUrl, setPreviewImageUrl)}
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
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Personal Information
            </h2>
          </div>

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
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Contact Information
            </h2>
          </div>

          <div className="space-y-6">
            <ModernInfoCard
              icon={Mail}
              iconGradient="from-blue-500 to-blue-600"
              label="EMAIL ADDRESS"
              value={profile?.email || ""}
              isEditing={false}
            />

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
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <Building className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Business Information
            </h2>
          </div>

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

        {isCredentialProvider && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg flex items-center justify-center mr-3">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Security</h2>
            </div>

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
                    onClick={() => resetPasswordForm(setShowPassword, setOtpSent, setPasswordValues)}
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
                      disabled={passwordSaving || sendingOtp || !passwordValues.currentPassword || !passwordValues.newPassword || !passwordValues.confirmPassword}
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
                    <div className="font-medium text-gray-800">••••••••••</div>
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
        )}

        {/* MFA Section (only for non-Google sign-in) */}
        {isCredentialProvider && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Multi-Factor Authentication (MFA)
              </h2>
            </div>
            <MfaSetup />
          </div>
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

// Using shared ModernInfoCard/PasswordRow; local props no longer needed

// Local duplicated components removed in favor of shared ones
