export function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  let str: string;
  if (typeof value === "object" && value !== null) {
    try {
      str = JSON.stringify(value);
    } catch {
      str = "";
    }
  } else if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    str = String(value);
  } else {
    str = "";
  }

  if (/[",\n]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(toCsvValue).join(",");
  const lines = rows.map((row) => headers.map((h) => toCsvValue(row[h])).join(","));
  return [headerLine, ...lines].join("\r\n");
}

export function buildCsvDownloadResponse(csv: string, filename: string) {
  const { NextResponse } = require("next/server");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function parseStatusParam(url: string): {
  status: "all" | "active" | "inactive";
  where: Record<string, unknown>;
} {
  const { searchParams } = new URL(url);
  const statusParam = (searchParams.get("status") || "all").toLowerCase();
  const status =
    statusParam === "active" || statusParam === "inactive" ? statusParam : "all";
  const where: Record<string, unknown> = {};
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  return { status, where };
}


