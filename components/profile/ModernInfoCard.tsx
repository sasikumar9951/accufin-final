"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export interface ModernInfoCardProps {
  icon: React.ElementType;
  iconGradient: string;
  label: string;
  value: string;
  isEditing: boolean;
  onEditToggle?: (isEditing: boolean) => void;
  onSave?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  isSaving?: boolean;
  placeholder?: string;
  inputType?: string;
}

export default function ModernInfoCard({
  icon: Icon,
  iconGradient,
  label,
  value,
  isEditing,
  onEditToggle,
  onSave,
  onChange,
  name,
  isSaving,
  placeholder,
  inputType = "text",
}: Readonly<ModernInfoCardProps>) {
  // Detect small screens to use a modal drawer for editing on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 640px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(("matches" in e ? e.matches : (e as MediaQueryList).matches));
    };
    // initialize
    handle(mql);
    const listener = (e: MediaQueryListEvent) => handle(e);
    if ("addEventListener" in mql) {
      mql.addEventListener("change", listener);
      return () => mql.removeEventListener("change", listener);
    } else {
      // Safari < 14
      // @ts-ignore
      mql.addListener(listener);
      return () => {
        // @ts-ignore
        mql.removeListener(listener);
      };
    }
  }, []);

  const handleEditClick = () => {
    if (isMobile) {
      setMobileOpen(true);
      return;
    }
    onEditToggle?.(true);
  };

  const handleMobileCancel = () => {
    setMobileOpen(false);
  };

  const handleMobileSave = async () => {
    await onSave?.();
    setMobileOpen(false);
  };

  return (
    <div className="flex items-center p-6 bg-gray-50 rounded-xl border-l-4 border-blue-500">
      <div className={`w-12 h-12 bg-gradient-to-r ${iconGradient} rounded-lg flex items-center justify-center mr-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{label}</div>
        {isEditing ? (
          <input
            className="text-lg font-medium bg-white border-2 border-blue-300 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 w-full"
            type={inputType}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={isSaving}
            autoFocus
          />
        ) : (
          <div
            className={`text-lg font-medium ${value ? "text-gray-900" : "text-gray-400"} truncate whitespace-nowrap`}
            title={value || "Not provided"}
          >
            {value || "Not provided"}
          </div>
        )}
      </div>

      {onEditToggle && (
        <div className="ml-4">
          {isEditing ? (
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEditToggle(false)} disabled={isSaving}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              className="hover:bg-purple-50 hover:border-purple-300 border-purple-200 bg-purple-50 text-purple-600"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Mobile drawer for editing */}
      {isMobile && (
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {label.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <div>
              <input
                className="text-base bg-white border-2 border-blue-300 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-3 w-full"
                type={inputType}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={isSaving}
                autoFocus
              />
            </div>
            <DialogFooter>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={handleMobileSave} disabled={isSaving} className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <Check className="w-4 h-4 mr-1" /> Save
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" onClick={handleMobileCancel} disabled={isSaving}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


