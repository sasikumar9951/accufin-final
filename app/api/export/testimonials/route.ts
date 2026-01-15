import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { toCsv, buildCsvDownloadResponse, parseStatusParam } from "@/lib/csv";


function mapTestimonialsToRows(
  testimonials: Array<{
    name: string | null;
    role: string | null;
    text: string | null;
    imagePath: string | null;
    isActive: boolean;
  }>
) {
  return testimonials.map((t) => ({
    Name: t.name,
    Role: t.role,
    Text: t.text,
    ImagePath: t.imagePath ?? "",
    Status: t.isActive ? "Active" : "Inactive",
  }));
}


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, where } = parseStatusParam(request.url);

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        role: true,
        text: true,
        imagePath: true,
        isActive: true,
      },
    });

    const rows = mapTestimonialsToRows(testimonials);

    const csv = toCsv(rows);
    const filename = `testimonials_${status}_${new Date().toISOString().slice(0, 10)}.csv`;
    return buildCsvDownloadResponse(csv, filename);
  } catch (error) {
    console.error("Export testimonials error", error);
    return NextResponse.json(
      { error: "Failed to export testimonials" },
      { status: 500 }
    );
  }
}
