"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SessionExpiredContent() {
  const searchParams = useSearchParams();
  const atParam = searchParams.get("at") ?? undefined;

  const expiredAtMs = atParam ? Number(atParam) : Number.NaN;
  const expiredAtText = Number.isNaN(expiredAtMs)
    ? "Unknown time"
    : new Date(expiredAtMs).toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 md:pt-[120px] pt-[150px]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2">
          <img
            src="/image-000.png"
            alt="Accufin Logo"
            className="h-24 w-auto"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Session Expired
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg ring-1 ring-gray-100 sm:rounded-xl sm:px-10">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Your session expired at{" "}
              <span className="font-semibold text-gray-900">
                {expiredAtText}
              </span>.
            </p>
            <p className="text-sm text-gray-500">
              For your security, you were automatically signed out after a
              period of inactivity.
            </p>
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/login"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#007399] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#0082a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Return to login
              </Link>
              <Link
                href="/"
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Return to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionExpiredPage() {
  return (
    <Suspense fallback={null}>
      <SessionExpiredContent />
    </Suspense>
  );
}
