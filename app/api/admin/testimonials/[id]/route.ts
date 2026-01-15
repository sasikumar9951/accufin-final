import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";
import { getSignedUrlFromPath } from "@/lib/s3";


export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testimonial = await prisma.testimonial.findUnique({ where: { id }});
  const withSignedUrl = {
    ...testimonial,
    imageUrl: testimonial?.imagePath ? await getSignedUrlFromPath(testimonial.imagePath) : null,
  };
  return NextResponse.json(withSignedUrl);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const { id } = await params;
    const body = await request.json();
    const { name, role, text, imagePath, isActive } = body;

    if (!name || !role || !text) return error("name, role and text are required", 400);

    const updateData: any = {
      name,
      role,
      text,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };

    // Only update imagePath if a new one is provided
    if (imagePath !== undefined) {
      updateData.imagePath = imagePath;
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: updateData,
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

    // Add signed URL for image if it exists
    const withSignedUrl = {
      ...updated,
      imageUrl: updated.imagePath
        ? await getSignedUrlFromPath(updated.imagePath)
        : null,
    };

    return NextResponse.json(withSignedUrl);
  } catch (err) {
    console.error("Failed to update testimonial", err);
    return error("Failed to update testimonial", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const { id } = await params;
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to delete testimonial", err);
    return error("Failed to delete testimonial", 500);
  }
}
