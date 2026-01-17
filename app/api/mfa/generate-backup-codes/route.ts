import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  generateBackupCodes,
  hashBackupCodes,
  formatBackupCodes,
} from "@/lib/mfa";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        mfaEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA must be enabled before generating backup codes" },
        { status: 400 }
      );
    }

    // Delete existing backup codes
    await prisma.mfaBackupCode.deleteMany({
      where: { userId: user.id },
    });

    // Generate new backup codes
    const codes = generateBackupCodes(8);
    const hashedCodes = await hashBackupCodes(codes);

    // Store hashed codes in database
    await prisma.mfaBackupCode.createMany({
      data: hashedCodes.map((hashedCode: any) => ({
        hashedCode,
        userId: user.id,
      })),
    });

    // Return formatted codes to user (only time they'll see them)
    const formattedCodes = formatBackupCodes(codes);

    return NextResponse.json({
      message: "Backup codes generated successfully",
      backupCodes: formattedCodes,
      warning:
        "Save these codes in a secure place. You won't be able to see them again.",
    });
  } catch (error) {
    console.error("Error in generate-backup-codes API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
