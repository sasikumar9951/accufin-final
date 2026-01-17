import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { toCsv, buildCsvDownloadResponse, parseStatusParam } from "@/lib/csv";


function formatDateISO(date: Date | null): string {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, where } = parseStatusParam(request.url);

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        email: true,
        contactNumber: true,
        occupation: true,
        sinNumber: true,
        businessNumber: true,
        dateOfBirth: true,
        isAdmin: true,
        isActive: true,
        _count: {
          select: {
            uploadedFiles: true,
            formResponses: true,
          },
        },
      },
    });

    // Count files received from admin per user
    const withAdminCounts = await Promise.all(
      users.map(async (u: any) => {
        const filesReceivedFromAdmin = await prisma.file.count({
          where: {
            receivedBy: { email: u.email },
            uploadedBy: { isAdmin: true },
          },
        });
        return { ...u, filesReceivedFromAdmin };
      })
    );

    const rows = withAdminCounts.map((u: any) => ({
      Name: u.name ?? "",
      Email: u.email,
      Phone: u.contactNumber ?? "",
      Occupation: u.occupation ?? "",
      SIN: u.sinNumber ?? "",
      BusinessNumber: u.businessNumber ?? "",
      DateOfBirth: formatDateISO(u.dateOfBirth),
      IsAdmin: u.isAdmin ? "Yes" : "No",
      IsActive: u.isActive ? "Active" : "Inactive",
      UploadedFiles: u._count.uploadedFiles,
      FilesFromAdmin: u.filesReceivedFromAdmin,
      FormResponses: u._count.formResponses,
    }));

    const csv = toCsv(rows);

    const filename = `users_${status}_${new Date().toISOString().slice(0, 10)}.csv`;
    return buildCsvDownloadResponse(csv, filename);
  } catch (error) {
    console.error("Export users error", error);
    return NextResponse.json(
      { error: "Failed to export users" },
      { status: 500 }
    );
  }
}
