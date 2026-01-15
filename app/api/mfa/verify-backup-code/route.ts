import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyBackupCode, cleanBackupCodeInput } from "@/lib/mfa";

export async function POST(request: NextRequest) {
  try {
    const { email, backupCode } = await request.json();

    if (!email || !backupCode) {
      return NextResponse.json(
        { error: "Email and backup code are required" },
        { status: 400 }
      );
    }

    const cleanCode = cleanBackupCodeInput(backupCode);

    if (cleanCode.length !== 8) {
      return NextResponse.json(
        { error: "Invalid backup code format" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        mfaEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account is inactive. Please contact support." },
        { status: 403 }
      );
    }

    if (!user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is not enabled for this account" },
        { status: 400 }
      );
    }

    // Find unused backup codes for this user
    const backupCodes = await prisma.mfaBackupCode.findMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    if (backupCodes.length === 0) {
      return NextResponse.json(
        { error: "No valid backup codes found. Please contact support." },
        { status: 400 }
      );
    }

    // Verify backup code against all unused codes
    let validCode = null;
    for (const code of backupCodes) {
      const isValid = await verifyBackupCode(cleanCode, code.hashedCode);
      if (isValid) {
        validCode = code;
        break;
      }
    }

    if (!validCode) {
      return NextResponse.json(
        { error: "Invalid backup code" },
        { status: 400 }
      );
    }

    // Mark backup code as used
    await prisma.mfaBackupCode.update({
      where: { id: validCode.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Count remaining backup codes
    const remainingCodes = await prisma.mfaBackupCode.count({
      where: {
        userId: user.id,
        used: false,
      },
    });

    return NextResponse.json({
      message: "Backup code verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      remainingBackupCodes: remainingCodes,
      warning:
        remainingCodes <= 2
          ? "You have few backup codes remaining. Consider generating new ones."
          : null,
    });
  } catch (error) {
    console.error("Error in verify-backup-code API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
