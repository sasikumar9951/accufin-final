import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const body = await request.json().catch(() => ({}));
    const id = body?.id as string | undefined;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Blog id is required" },
        { status: 400 }
      );
    }

    await prisma.blogs.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error?.message || "Failed to delete blog";
    return error(message, 500);
  }
}
