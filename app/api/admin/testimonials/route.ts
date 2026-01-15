import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const body = await request.json();
    const { name, role, text, imagePath, isActive } = body ?? {};

    if (!name || !role || !text) return error("name, role and text are required", 400);

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        text,
        imagePath: imagePath || null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json(testimonial, { status: 201 });
  } catch (err) {
    console.error("Failed to create testimonial", err);
    return error("Failed to create testimonial", 500);
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        role: true,
        text: true,
        imagePath: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(testimonials);
  } catch (err) {
    console.error("Failed to fetch testimonials", err);
    return error("Failed to fetch testimonials", 500);
  }
}
