import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserSession, error } from "@/lib/api-helpers";
import { compare, hash } from "bcryptjs";

export async function PUT(req: NextRequest) {
  const session = await requireUserSession();
  if (!session) return error("Unauthorized", 401);

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) return error("Current and new passwords are required", 400);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return error("User not found", 404);

  const isPasswordCorrect = await compare(currentPassword, user.password);

  if (!isPasswordCorrect) return error("Incorrect current password", 400);

  const hashedNewPassword = await hash(newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedNewPassword },
  });

  // Notify the user
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
        message: `User ${user?.email || session.user.id} changed their password`,
        userId: a.id,
      })),
    });
  }

  return NextResponse.json({ message: "Password updated successfully" });
}
