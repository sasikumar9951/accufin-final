import { NextResponse } from "next/server";
import { requireUserSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { getSignedUrlFromPath } from "@/lib/s3";

export async function GET() {
  try {
    const session = await requireUserSession();
    if (!session) return error("Unauthorized", 401);
    const files = await prisma.file.findMany({
      where: {
        uploadedById: session.user.id,
        isArchived: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const signedFiles = await Promise.all(
      files.map(async (file) => {
        if (file.type !== "folder" && file.path) {
          const signedUrl = await getSignedUrlFromPath(file.path);
          return {
            ...file,
            url: signedUrl,
          };
        }
        return file;
      })
    );
    return NextResponse.json(signedFiles, { status: 200 });
  } catch (e) {
    console.log(e);
    return error("Internal server error", 500);
  }
}
