import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "No account found with that email" },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        expiresAt,
        userId: user.id,
      },
    });

    // Build reset URL (also log in non-production for debugging)
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    if (process.env.NODE_ENV !== "production") {
      console.log("Password reset URL (dev):", resetUrl);
    }

    // Send password reset email without blocking the response
    sendPasswordResetEmail({
      userEmail: user.email,
      userName: user.name || "User",
      resetToken,
    }).catch((emailError) => {
      console.error("Error sending password reset email:", emailError);
    });

    return NextResponse.json(
      { message: "Password reset link sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
