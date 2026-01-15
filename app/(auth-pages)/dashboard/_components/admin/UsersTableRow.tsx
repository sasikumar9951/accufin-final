"use client";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  ShieldCheck,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { ImageFitMode, getImageFitClass, isValidImageFitMode } from "@/types/ui";

interface UsersTableRowProps {
  readonly user: any;
  readonly onlineUsers: Set<string>;
  readonly session: any;
  readonly togglingAdmin: string | null;
  readonly getUserRowClassNameWithStorage: (
    user: any,
    onlineUsers: Set<string>,
    storageUsed: number,
    maxStorageLimit: number
  ) => string;
  readonly getAvatarRingClassNameWithStorage: (
    user: any,
    onlineUsers: Set<string>,
    storageUsed: number,
    maxStorageLimit: number
  ) => string;
  readonly getStatusBadgeClassNameWithStorage: (
    user: any,
    onlineUsers: Set<string>,
    storageUsed: number,
    maxStorageLimit: number
  ) => string;
  readonly formatUsedStorage: (kb: number | null | undefined) => string;
  readonly formatMaxStorageGB: (kb: number | null | undefined) => string;
  readonly calcStoragePercent: (
    usedKb: number | null | undefined,
    maxKb: number | null | undefined
  ) => number;
  readonly renderStorageProgressBar: (
    percent: number,
    getProgressBarColor: (p: number) => string
  ) => React.ReactElement;
  readonly getProgressBarColor: (percent: number) => string;
  readonly copyToClipboard: (
    text: string,
    successMessage: string,
    errorMessage: string,
    toast: any
  ) => Promise<void>;
  readonly handleAdminToggle: (userId: string, currentIsAdmin: boolean) => void;
  readonly handleActiveToggle: (userId: string, currentIsActive: boolean) => void;
  readonly handleViewUserClick: (user: any) => void;
  readonly handleEditUserClick: (user: any) => void;
  readonly handleDeleteUserClick: (user: any) => void;
}

export default function UsersTableRow({
  user,
  onlineUsers,
  session,
  togglingAdmin,
  getUserRowClassNameWithStorage,
  getAvatarRingClassNameWithStorage,
  getStatusBadgeClassNameWithStorage,
  formatUsedStorage,
  formatMaxStorageGB,
  calcStoragePercent,
  renderStorageProgressBar,
  getProgressBarColor,
  copyToClipboard,
  handleAdminToggle,
  handleActiveToggle,
  handleViewUserClick,
  handleEditUserClick,
  handleDeleteUserClick,
}: UsersTableRowProps) {
  const [imageFitMode, setImageFitMode] = useState<ImageFitMode | null>(null);

  useEffect(() => {
    try {
      const persisted = localStorage.getItem(`profileImageFitMode:${user?.id}`);
      if (persisted && isValidImageFitMode(persisted)) {
        setImageFitMode(persisted);
      }
    } catch {}

    const modeHandler = (e: Event) => {
      const ce = e as CustomEvent<{ mode?: ImageFitMode }>;
      const m = ce.detail?.mode;
      if (m && isValidImageFitMode(m)) {
        // Only apply for current signed-in user's row
        if (session?.user?.id === user?.id) setImageFitMode(m);
      }
    };
    try { globalThis.addEventListener('profile:image_fit_mode_updated', modeHandler as EventListener); } catch {}
    return () => {
      try { globalThis.removeEventListener('profile:image_fit_mode_updated', modeHandler as EventListener); } catch {}
    };
  }, [session?.user?.id, user?.id]);

  return (
    <tr
      key={user.id}
      className={`border-emerald-100 hover:bg-emerald-100 transition-colors ${getUserRowClassNameWithStorage(
        user,
        onlineUsers,
        user.storageUsed,
        user.maxStorageLimit
      )}`}
    >
      <td className="py-3 px-2 w-16">
        <div className="relative">
          <Avatar
            className={`h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 ring-2 ${getAvatarRingClassNameWithStorage(
              user,
              onlineUsers,
              user.storageUsed,
              user.maxStorageLimit
            )}`}
          >
            {(user.profileImageUrl || user.profileUrl) && (
              <AvatarImage
                src={user.profileImageUrl || user.profileUrl}
                alt={user.name || user.email}
                className={getImageFitClass(imageFitMode || undefined)}
                onError={() => {
                  // Suppress error logging for Google profile images
                  const imageUrl = user.profileImageUrl || user.profileUrl;
                  if (!imageUrl?.includes('googleusercontent.com')) {
                    console.error('Failed to load profile image:', imageUrl);
                  }
                }}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            )}
            <AvatarFallback
              className={`font-semibold text-xs ${getStatusBadgeClassNameWithStorage(
                user,
                onlineUsers,
                user.storageUsed,
                user.maxStorageLimit
              )}`}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </td>
      <td className="py-3 px-2 w-24">
        <div className="font-semibold text-gray-900 text-xs truncate max-w-20">
          {user.name || "No name"}
        </div>
      </td>
      <td className="py-3 px-2 w-32">
        <button
          type="button"
          title="Click to copy email"
          onClick={() =>
            copyToClipboard(
              user.email,
              "Email copied!",
              "Failed to copy email",
              toast
            )
          }
          className="text-left text-emerald-600 font-medium text-xs truncate max-w-28 hover:underline cursor-pointer"
        >
          {user.email}
        </button>
      </td>
      <td className="py-3 px-2 w-20">
        {user.contactNumber ? (
          <button
            type="button"
            title="Click to copy phone"
            onClick={() =>
              copyToClipboard(
                user.contactNumber,
                "Phone number copied!",
                "Failed to copy phone number",
                toast
              )
            }
            className="text-left text-gray-700 text-xs truncate max-w-16 hover:underline cursor-pointer"
          >
            {user.contactNumber}
          </button>
        ) : (
          <div className="text-gray-400 text-xs truncate max-w-16">{""}</div>
        )}
      </td>
      <td className="py-3 px-2 w-24">
        <div className="text-gray-700 text-xs truncate max-w-20">
          {user.sinNumber || ""}
        </div>
      </td>
      <td className="py-3 px-2 w-28">
        <div className="text-gray-700 text-xs truncate max-w-24">
          {user.businessNumber || ""}
        </div>
      </td>
      <td className="py-3 px-2 w-20">
        <div className="text-gray-700 text-xs">
          {user.dateOfBirth
            ? new Date(user.dateOfBirth).toLocaleDateString()
            : ""}
        </div>
      </td>
      <td className="py-3 px-2 w-32">
        <div className="text-gray-700 text-xs font-medium text-center">
          {formatUsedStorage(user.storageUsed)} /{" "}
          {formatMaxStorageGB(user.maxStorageLimit)}
          <div className="text-[10px] text-gray-500 mt-0.5">
            {calcStoragePercent(user.storageUsed, user.maxStorageLimit)}%
          </div>
          {renderStorageProgressBar(
            calcStoragePercent(user.storageUsed, user.maxStorageLimit),
            getProgressBarColor
          )}
        </div>
      </td>
      <td className="py-3 px-2 w-20">
        <div className="text-gray-600 text-xs">
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td className="py-3 px-2 w-20">
        <div className="flex flex-col items-center space-y-1">
          {user.isAdmin ? (
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">Admin</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">User</span>
            </div>
          )}
          {session?.user?.id !== user.id && (
            <Switch
              checked={user.isAdmin}
              onCheckedChange={() => handleAdminToggle(user.id, user.isAdmin)}
              disabled={togglingAdmin === user.id}
              className="scale-75"
            />
          )}
        </div>
      </td>
      <td className="py-3 px-2 w-20">
        <div className="flex flex-col items-center space-y-1">
          <span
            className={`text-xs font-medium ${
              user.isActive ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>
          {session?.user?.id !== user.id && (
            <Switch
              checked={!!user.isActive}
              onCheckedChange={() =>
                handleActiveToggle(user.id, !!user.isActive)
              }
              className="scale-75"
            />
          )}
        </div>
      </td>
      <td className="py-3 px-2 w-20">
        <div className="flex flex-col items-center space-y-1">
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${
                onlineUsers.has(user.id)
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                onlineUsers.has(user.id) ? "text-green-700" : "text-gray-500"
              }`}
            >
              {onlineUsers.has(user.id) ? "Online" : "Offline"}
            </span>
          </div>
          {user.lastActivityAt && (
            <div className="text-xs text-gray-400">
              {new Date(user.lastActivityAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      </td>
      <td className="py-3 px-3 w-24 text-center relative">
        <div className="flex justify-center">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                title="Actions"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-48 z-[9999]"
              side="bottom"
              sideOffset={4}
              avoidCollisions={true}
              collisionPadding={8}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem
                onClick={() => handleViewUserClick(user)}
                className="cursor-pointer"
              >
                <Eye className="w-4 h-4 mr-2 text-blue-600" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditUserClick(user)}
                className="cursor-pointer"
              >
                <Pencil className="w-4 h-4 mr-2 text-purple-600" />
                Edit User
              </DropdownMenuItem>
              {session?.user?.id !== user.id && (
                <DropdownMenuItem
                  onClick={() => handleDeleteUserClick(user)}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                  Delete User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
