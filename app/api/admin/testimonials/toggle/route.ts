import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const body = await request.json();
    const { id, isActive } = body;
    if (!id || typeof isActive !== "boolean") return error("Testimonial id and isActive are required", 400);

    const updated = await prisma.testimonial.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error toggling testimonial status:", err);
    return error("Failed to toggle testimonial status", 500);
  }
}
