import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all open contacts (public endpoint)
export async function GET() {
  try {
    const openContacts = await prisma.openContact.findMany({
      include: {
        links: {
          orderBy: {
            createdAt: "asc",
          },
        },
        importantDates: {
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    return NextResponse.json(openContacts);
  } catch (error) {
    console.error("Error fetching open contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch open contacts" },
      { status: 500 }
    );
  }
}
