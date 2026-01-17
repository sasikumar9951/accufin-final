import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { toCsv, buildCsvDownloadResponse } from "@/lib/csv";


function formatDateYYYYMMDDLocal(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dates = await prisma.importantDate.findMany({
      orderBy: { date: "asc" },
      select: {
        title: true,
        description: true,
        date: true,
      },
    });

    const rows = dates.map((d: any) => ({
      Title: d.title,
      Description: d.description ?? "",
      // Prefix with apostrophe to force Excel to treat as text and avoid #####
      Date: d.date ? `'${formatDateYYYYMMDDLocal(d.date)}` : "",
    }));

    const csv = toCsv(rows);
    const filename = `important_dates_${new Date().toISOString().slice(0, 10)}.csv`;
    return buildCsvDownloadResponse(csv, filename);
  } catch (error) {
    console.error("Export important dates error", error);
    return NextResponse.json({ error: "Failed to export important dates" }, { status: 500 });
  }
}


