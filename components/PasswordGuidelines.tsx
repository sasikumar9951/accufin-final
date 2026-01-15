"use client";
import React from "react";

type PasswordGuidelinesProps = {
  visible: boolean;
  password: string;
};

export default function PasswordGuidelines({
  visible,
  password,
}: Readonly<PasswordGuidelinesProps>) {
  if (!visible) return null;
  const lengthOk = password.length >= 8;
  const lowerOk = /[a-z]/.test(password);
  const upperOk = /[A-Z]/.test(password);
  const numberOk = /\d/.test(password);
  const specialOk = /[!@#$%^&*()[\]{};:'",.<>/?`~_+=\-\\|]/.test(password);
  return (
    <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
      <div className="font-semibold mb-1">Create a strong password:</div>
      <ul className="pl-1 space-y-1">
        <li className={lengthOk ? "text-green-600" : "text-red-600"}>
          {lengthOk ? "✓" : "✕"} At least 8 characters
        </li>
        <li className={upperOk ? "text-green-600" : "text-red-600"}>
          {upperOk ? "✓" : "✕"} Include at least one uppercase letter
        </li>
        <li className={lowerOk ? "text-green-600" : "text-red-600"}>
          {lowerOk ? "✓" : "✕"} Include at least one lowercase letter
        </li>
        <li className={numberOk ? "text-green-600" : "text-red-600"}>
          {numberOk ? "✓" : "✕"} Include at least one number
        </li>
        <li className={specialOk ? "text-green-600" : "text-red-600"}>
          {specialOk ? "✓" : "✕"} Include at least one special character
          (!@#$%^&*)
        </li>
      </ul>
    </div>
  );
}
