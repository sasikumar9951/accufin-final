import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ message: "Token and password are required" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, id: { not: resetToken.id } },
      }),
    ]);

    // Fetch the user for notifications
    const user = await prisma.user.findUnique({
      where: { id: resetToken.userId },
      select: { id: true, email: true },
    });

    if (user) {
      // Notify the user
      await prisma.notification.create({
        data: {
          title: "Password Reset Successful",
          message: "Your password was reset successfully.",
          userId: user.id,
        },
      });

      // Notify all admins
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            title: "User Password Reset",
            message: `User ${user.email} reset their password using token`,
            userId: a.id,
          })),
        });
      }
    }

    return NextResponse.json({ message: "Password has been reset successfully" }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


