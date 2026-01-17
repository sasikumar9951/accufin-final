import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSignedUrlFromPath } from "@/lib/s3";

export async function GET(_request: NextRequest) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        role: true,
        text: true,
        imagePath: true,
      },
    });
    const withSignedUrls = await Promise.all(
      testimonials.map(async (t: any) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        text: t.text,
        imageUrl: t.imagePath ? await getSignedUrlFromPath(t.imagePath) : null,
      }))
    );
    return NextResponse.json(withSignedUrls);
  } catch (error) {
    console.error("Failed to fetch testimonials", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
