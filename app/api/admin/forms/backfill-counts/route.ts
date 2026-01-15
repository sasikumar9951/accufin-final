import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/admin/forms/backfill-counts
// Secured by ADMIN_BACKFILL_TOKEN. Idempotent: recomputes and updates counts.
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = req.headers.get("x-admin-token") || url.searchParams.get("token");
    const expected = process.env.ADMIN_SECRET;

    if (!expected || token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch counts for all forms via Prisma _count
    const forms = await prisma.forms.findMany({
      select: {
        id: true,
        _count: {
          select: {
            inputs: true,
            selections: true,
            multipleChoice: true,
            ratings: true,
            matrices: true,
            netPromoterScores: true,
            separators: true,
            formResponses: true,
            assignedUsers: true,
          },
        },
      },
    });

    const updates = forms.map((f) => {
      const fieldsCount =
        f._count.inputs +
        f._count.selections +
        f._count.multipleChoice +
        f._count.ratings +
        f._count.matrices +
        f._count.netPromoterScores +
        f._count.separators;

      const responsesCount = f._count.formResponses;
      const assignedUsersCount = f._count.assignedUsers;

      return prisma.forms.update({
        where: { id: f.id },
        data: { fieldsCount, responsesCount, assignedUsersCount },
      });
    });

    const result = await prisma.$transaction(updates);

    return NextResponse.json({
      updated: result.length,
      details: forms.map((f) => ({
        id: f.id,
        fieldsCount:
          f._count.inputs +
          f._count.selections +
          f._count.multipleChoice +
          f._count.ratings +
          f._count.matrices +
          f._count.netPromoterScores +
          f._count.separators,
        responsesCount: f._count.formResponses,
        assignedUsersCount: f._count.assignedUsers,
      })),
    });
  } catch (error: any) {
    console.error("backfill-counts error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


