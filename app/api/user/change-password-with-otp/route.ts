import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserSession, error } from "@/lib/api-helpers";
import { compare, hash } from "bcryptjs";
import { sendPasswordChangedEmail } from "@/lib/email";

export async function PUT(req: NextRequest) {
  const session = await requireUserSession();
  if (!session) return error("Unauthorized", 401);

  const { currentPassword, newPassword, otp } = await req.json();

  if (!currentPassword || !newPassword || !otp) {
    return NextResponse.json(
      { error: "Current password, new password, and OTP are required" },
      { status: 400 }
    );
  }

  // Find the user
  const user = await prisma.user.findFirst({
    where: { id: session.user.id },
  });

  if (!user) return error("User not found", 404);

  // Verify current password
  const isPasswordCorrect = await compare(currentPassword, user.password);

  if (!isPasswordCorrect) return error("Incorrect current password", 400);

  // Check if new password is different from current password
  const isSamePassword = await compare(newPassword, user.password);

  if (isSamePassword) return error("New password must be different from current password", 400);

  // Verify OTP
  const otpToken = await prisma.otpToken.findFirst({
    where: {
      userId: user.id,
      purpose: "password-change",
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpToken) return error("Invalid or expired OTP. Please request a new one.", 400);

  // Verify OTP
  const isValidOtp = await compare(otp, otpToken.hashedOtp);

  if (!isValidOtp) return error("Invalid OTP", 400);

  // Mark OTP as used
  await prisma.otpToken.update({
    where: { id: otpToken.id },
    data: { used: true },
  });

  // Clean up all other OTP tokens for this user and purpose
  await prisma.otpToken.deleteMany({
    where: {
      userId: user.id,
      purpose: "password-change",
      id: {
        not: otpToken.id,
      },
    },
  });

  // Hash and update the new password
  const hashedNewPassword = await hash(newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedNewPassword },
  });

  // Send password change notification email
  try {
    await sendPasswordChangedEmail({
      userEmail: user.email,
      userName: user.name || user.email.split("@")[0],
      changeTime: new Date().toLocaleString(),
    });
  } catch (emailError) {
    console.error("Failed to send password change notification email:", emailError);
    // Don't fail the request if email fails, just log the error
  }

  // Create in-app notification for the user
  await prisma.notification.create({
    data: {
      title: "Password Changed",
      message: "Your password was changed successfully.",
      userId: session.user.id,
    },
  });

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a: any) => ({
        title: `User Password Changed`,
        message: `User ${user.email} changed their password`,
        userId: a.id,
      })),
    });
  }

  return NextResponse.json({ message: "Password updated successfully" });
}
