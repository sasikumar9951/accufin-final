import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await requireAdminSession();
    if (!user) return error("Unauthorized", 401);
    const blogs = await prisma.blogs.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(blogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    return error("Failed to fetch blogs", 500);
  }
}
