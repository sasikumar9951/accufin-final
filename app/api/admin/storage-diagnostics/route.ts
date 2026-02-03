import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

function parseSizeToKB(size: string | null | undefined): number {
  if (!size) return 0;
  const trimmed = size.trim();
  const sizeRegex = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i;
  const match = sizeRegex.exec(trimmed);
  if (!match) return 0;
  const value = Number.parseFloat(match[1]);
  const unit = (match[2] || "KB").toUpperCase();
  switch (unit) {
    case "B":
      return value / 1024;
    case "KB":
      return value;
    case "MB":
      return value * 1024;
    case "GB":
      return value * 1024 * 1024;
    default:
      return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);

    const { action } = await request.json();

    if (action === "find-mismatches") {
      // Find all users with storage mismatches
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          storageUsed: true,
          maxStorageLimit: true,
          _count: {
            select: {
              uploadedFiles: true,
              receivedFiles: true,
            },
          },
        },
      });

      const mismatches = [];

      for (const user of users) {
        // Find actual files for this user
        const userFiles = await prisma.file.findMany({
          where: {
            OR: [
              { uploadedById: user.id },
              { receivedById: user.id },
            ],
          },
          select: {
            id: true,
            size: true,
          },
        });

        const actualStorageKB = userFiles.reduce(
          (sum, f) => sum + parseSizeToKB(f.size),
          0
        );
        const roundedActual = Math.round(actualStorageKB);
        const reportedStorage = user.storageUsed || 0;

        // Flag if there's a mismatch
        if (Math.abs(roundedActual - reportedStorage) > 100) {
          // More than 100KB difference
          mismatches.push({
            userId: user.id,
            email: user.email,
            name: user.name,
            reportedStorageKB: reportedStorage,
            actualStorageKB: roundedActual,
            fileCount: userFiles.length,
            difference: roundedActual - reportedStorage,
            status:
              roundedActual === 0 && reportedStorage > 0
                ? "CRITICAL: Files missing"
                : "MISMATCH",
          });
        }
      }

      // Sort by severity (missing files first, then largest mismatches)
      mismatches.sort((a, b) => {
        const aIsCritical = a.status === "CRITICAL: Files missing" ? 1 : 0;
        const bIsCritical = b.status === "CRITICAL: Files missing" ? 1 : 0;
        if (aIsCritical !== bIsCritical) return bIsCritical - aIsCritical;
        return Math.abs(b.difference) - Math.abs(a.difference);
      });

      return NextResponse.json({
        totalUsers: users.length,
        mismatchCount: mismatches.length,
        mismatches: mismatches.slice(0, 50), // Return top 50
      });
    }

    if (action === "find-orphaned-files") {
      // Find files with NULL user IDs
      const orphanedFiles = await prisma.file.findMany({
        where: {
          AND: [
            {
              OR: [
                { uploadedById: null },
                { receivedById: null },
              ],
            },
            {
              type: { not: "folder" },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          size: true,
          uploadedById: true,
          receivedById: true,
          createdAt: true,
        },
      });

      const orphanedStorageKB = orphanedFiles.reduce(
        (sum, f) => sum + parseSizeToKB(f.size),
        0
      );

      return NextResponse.json({
        orphanedFileCount: orphanedFiles.length,
        orphanedStorageKB: Math.round(orphanedStorageKB),
        files: orphanedFiles.slice(0, 20),
      });
    }

    if (action === "fix-all-storage") {
      // Recalculate storage for ALL users
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      const results = [];

      for (const user of users) {
        const userFiles = await prisma.file.findMany({
          where: {
            OR: [
              { uploadedById: user.id },
              { receivedById: user.id },
            ],
          },
          select: {
            size: true,
          },
        });

        const totalKB = Math.round(
          userFiles.reduce((sum, f) => sum + parseSizeToKB(f.size), 0)
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { storageUsed: totalKB },
        });

        results.push({
          userId: user.id,
          newStorageUsed: totalKB,
          fileCount: userFiles.length,
        });
      }

      return NextResponse.json({
        message: "Storage recalculated for all users",
        updatedCount: results.length,
        results: results.filter(r => r.newStorageUsed > 0).slice(0, 20),
      });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (e) {
    console.error("Error in storage diagnostics:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
