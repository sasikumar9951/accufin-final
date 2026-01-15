import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  generateTotpSecret,
  generateQrCodeUrl,
  generateQrCodeImage,
  encryptTotpSecret,
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
        email: true,
        name: true,
        totpEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.totpEnabled) {
      return NextResponse.json(
        { error: "TOTP is already enabled for this account" },
        { status: 409 }
      );
    }

    // Generate new TOTP secret
    const secret = generateTotpSecret();
    const encryptedSecret = encryptTotpSecret(secret);

    // Generate QR code URL and image
    const serviceName = "AccuFin";
    const qrCodeUrl = generateQrCodeUrl(user.email, secret, serviceName);
    const qrCodeImage = await generateQrCodeImage(qrCodeUrl);

    // Store encrypted secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecret: encryptedSecret,
      },
    });

    return NextResponse.json({
      message: "TOTP setup initiated",
      qrCodeImage,
      manualEntryKey: secret, // For manual entry in authenticator apps
      serviceName,
      userEmail: user.email,
    });
  } catch (error) {
    console.error("Error in setup-totp API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
