"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordRowProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function PasswordRow({ label, name, value, onChange, isSaving, onFocus, onBlur }: Readonly<PasswordRowProps>) {
  const [isVisible, setIsVisible] = React.useState(false);
  return (
    <div className="flex items-center p-4 bg-gray-50 rounded-xl">
      <label className="w-1/3 text-sm font-medium text-gray-700">{label}</label>
      <div className="relative flex-1">
        <input
          type={isVisible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={isSaving}
          className="w-full bg-white border-2 border-gray-200 focus:border-blue-500 focus:outline-none rounded-lg px-4 py-2 pr-12"
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
        >
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}


