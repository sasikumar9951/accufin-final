import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ONE_GB_IN_KB = 1024 * 1024; // 1,048,576 KB

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId) {
      const updated = await prisma.user.updateMany({
        where: { id: userId, maxStorageLimit: 0 },
        data: { maxStorageLimit: ONE_GB_IN_KB },
      });
      return NextResponse.json({ ok: true, updated: updated.count, userId });
    }

    const updated = await prisma.user.updateMany({
      where: { maxStorageLimit: 0 },
      data: { maxStorageLimit: ONE_GB_IN_KB },
    });

    return NextResponse.json({ ok: true, updated: updated.count, valueKb: ONE_GB_IN_KB });
  } catch (error) {
    console.error("backfill-max-storage error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}


