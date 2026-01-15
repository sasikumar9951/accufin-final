import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH - Toggle form compulsory status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isCompulsory } = body;

    if (!id || typeof isCompulsory !== "boolean") {
      return NextResponse.json(
        { error: "Form ID and isCompulsory status are required" },
        { status: 400 }
      );
    }

    const updatedForm = await prisma.forms.update({
      where: { id },
      data: { isCompulsory },
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error("Error toggling form compulsory status:", error);
    return NextResponse.json(
      { error: "Failed to toggle form compulsory status" },
      { status: 500 }
    );
  }
}
