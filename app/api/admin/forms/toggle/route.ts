import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH - Toggle form active status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Form ID and isActive status are required" },
        { status: 400 }
      );
    }

    const updatedForm = await prisma.forms.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error("Error toggling form status:", error);
    return NextResponse.json(
      { error: "Failed to toggle form status" },
      { status: 500 }
    );
  }
}
