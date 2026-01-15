"use client";

import type React from "react";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import AdminDashboard from "./_components/admin/AdminDashboard";
import UserDashboard from "./_components/user/UserDashboard";

export default function LoginPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <Suspense fallback={<div className="min-h-screen bg-cyan-50" />}>
      {user?.isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </Suspense>
  );
}
