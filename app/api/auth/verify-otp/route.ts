import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, otp, purpose } = await request.json();

    if (!email || !otp || !purpose) {
      return NextResponse.json(
        { error: "Email, OTP, and purpose are required" },
        { status: 400 }
      );
    }

    if (!["login", "signup", "password-change"].includes(purpose)) {
      return NextResponse.json(
        { error: "Invalid purpose. Must be 'login', 'signup', or 'password-change'" },
        { status: 400 }
      );
    }

    // Rate limiting: Check last 3 verification attempts in 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentAttempts = await prisma.rateLimit.findMany({
      where: {
        identifier: email,
        action: "verify_otp",
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    if (recentAttempts.length >= 3) {
      const oldestAttempt = recentAttempts.at(-1) ?? null
      if (!oldestAttempt) {
        return NextResponse.json(
          { error: "Too many verification attempts. Please try again later." },
          { status: 429 }
        );
      }
      const timeUntilReset =
        60 -
        Math.floor((Date.now() - oldestAttempt.createdAt.getTime()) / 1000);

      return NextResponse.json(
        {
          error: `Too many verification attempts. Please try again in ${timeUntilReset} seconds.`,
          retryAfter: timeUntilReset,
        },
        { status: 429 }
      );
    }

    // Find user first
    const cleanEmail = email.toLowerCase() as string;
    const user = await prisma.user.findFirst({
      where: { email: {
        equals: cleanEmail,
        mode: "insensitive",
      } },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    // Find valid OTP token
    const otpToken = await prisma.otpToken.findFirst({
      where: {
        userId: user.id,
        purpose,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpToken) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOtp = await compare(otp, otpToken.hashedOtp);

    // Record rate limit attempt (both valid and invalid attempts)
    await prisma.rateLimit.create({
      data: {
        identifier: email,
        action: "verify_otp",
      },
    });

    if (!isValidOtp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Mark OTP as used
    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { used: true },
    });

    // Clean up all other OTP tokens for this user and purpose
    await prisma.otpToken.deleteMany({
      where: {
        userId: user.id,
        purpose,
        id: {
          not: otpToken.id,
        },
      },
    });

    return NextResponse.json({
      message: "OTP verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
      },
      purpose,
    });
  } catch (error) {
    console.error("Error in verify-otp API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
