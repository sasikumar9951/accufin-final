import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verifyTotpToken } from "@/lib/mfa";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, enableTotp } = await request.json();

    if (!token || token.length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit code" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        totpSecret: true,
        totpEnabled: true,
        preferredMfaMethod: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.totpSecret) {
      return NextResponse.json(
        { error: "TOTP is not set up for this account" },
        { status: 400 }
      );
    }

    // Verify the TOTP token
    const isValid = verifyTotpToken(token, user.totpSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // If enableTotp is true, enable TOTP for the user
    if (enableTotp) {
      const updateData: any = {
        totpEnabled: true,
        mfaEnabled: true,
        emailMfaEnabled: false, // Disable email MFA when enabling TOTP
        preferredMfaMethod: "authenticator",
      };

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      return NextResponse.json({
        message: "Authenticator app enabled successfully",
        totpEnabled: true,
      });
    }

    // Otherwise, just verify the token (for login purposes)
    return NextResponse.json({
      message: "Verification code verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("Error in verify-totp API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
