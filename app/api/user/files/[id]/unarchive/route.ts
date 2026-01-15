import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const fileId = id;
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: { isArchived: false },
    });

    // Create a notification for the user about unarchiving the file
    if (session.user.id) {
      try {
        await prisma.notification.create({
          data: {
            title: "File restored",
            message: `Your file "${file.name ?? "Untitled"}" has been restored from archive.`,
            user: { connect: { id: session.user.id } },
          },
        });
      } catch (notifyError) {
        console.error("Failed to create unarchive notification:", notifyError);
      }
    }

    return NextResponse.json(updatedFile, { status: 200 });
  } catch (e) {
    console.error("Error unarchiving file:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
