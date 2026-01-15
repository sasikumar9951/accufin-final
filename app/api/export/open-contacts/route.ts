import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { toCsv, buildCsvDownloadResponse } from "@/lib/csv";


function addContactRow(
  rows: Array<Record<string, unknown>>,
  contact: {
    address: string | null;
    phone1: string | null;
    phone2: string | null;
    email: string | null;
  }
): void {
  rows.push({
    Type: "Contact",
    Address: contact.address ?? "",
    Phone1: contact.phone1 ?? "",
    Phone2: contact.phone2 ?? "",
    Email: contact.email ?? "",
  });
}

function addImportantDateRows(
  rows: Array<Record<string, unknown>>,
  importantDates: Array<{
    title: string;
    description: string | null;
    date: Date | null;
  }>
): void {
  for (const d of importantDates) {
    rows.push({
      Type: "ImportantDate",
      Title: d.title,
      Description: d.description ?? "",
      Date: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
    });
  }
}

function addLinkRows(
  rows: Array<Record<string, unknown>>,
  links: Array<{ name: string; url: string }>
): void {
  for (const l of links) {
    rows.push({
      Type: "Link",
      Name: l.name,
      Url: l.url,
    });
  }
}

function buildCsvRows(
  contacts: Array<{
    address: string | null;
    phone1: string | null;
    phone2: string | null;
    email: string | null;
    importantDates: Array<{
      title: string;
      description: string | null;
      date: Date | null;
    }>;
    links: Array<{ name: string; url: string }>;
  }>
): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];

  for (const c of contacts) {
    addContactRow(rows, c);

    if (c.importantDates && c.importantDates.length > 0) {
      addImportantDateRows(rows, c.importantDates);
    }

    if (c.links && c.links.length > 0) {
      addLinkRows(rows, c.links);
    }
  }

  return rows;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contacts = await prisma.openContact.findMany({
      include: {
        links: true,
        importantDates: true,
      },
    });

    const rows = buildCsvRows(contacts);
    const csv = toCsv(rows);
    const filename = `open_contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    return buildCsvDownloadResponse(csv, filename);
  } catch (error) {
    console.error("Export open contacts error", error);
    return NextResponse.json(
      { error: "Failed to export open contacts" },
      { status: 500 }
    );
  }
}
