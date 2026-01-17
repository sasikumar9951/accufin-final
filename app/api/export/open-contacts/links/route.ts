import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { toCsv, buildCsvDownloadResponse } from "@/lib/csv";


function mapLinksToRows(links: Array<{ name: string | null; url: string | null }>) {
  return links.map((l: any) => ({
    Name: l.name,
    Url: l.url,
  }));
}


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = await prisma.link.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        name: true,
        url: true,
      },
    });

    const rows = mapLinksToRows(links);

    const csv = toCsv(rows);
    const filename = `external_links_${new Date().toISOString().slice(0, 10)}.csv`;
    return buildCsvDownloadResponse(csv, filename);
  } catch (error) {
    console.error("Export external links error", error);
    return NextResponse.json({ error: "Failed to export external links" }, { status: 500 });
  }
}


