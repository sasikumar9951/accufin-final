import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch upcoming important dates (public endpoint)
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const importantDates = await prisma.importantDate.findMany({
      where: {
        date: {
          gte: today, // Only dates from today onwards
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(importantDates);
  } catch (error) {
    console.error("Error fetching important dates:", error);
    return NextResponse.json(
      { error: "Failed to fetch important dates" },
      { status: 500 }
    );
  }
}
