import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export function ok(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function forbidden(message = "Forbidden", status = 403) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized(message = "Unauthorized", status = 401) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isAdmin) return null;
  return session;
}

export async function requireUserSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}


