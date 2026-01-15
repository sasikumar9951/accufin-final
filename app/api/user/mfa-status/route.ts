import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserMfaStatus } from "@/lib/mfa";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase() as string;
    const user = await prisma.user.findFirst({
      where: { email: {
        equals: cleanEmail,
        mode: "insensitive",
      } },
      select: {
        id: true,
        mfaEnabled: true,
        preferredMfaMethod: true,
        totpEnabled: true,
        smsEnabled: true,
        emailMfaEnabled: true,
        contactNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mfaStatus = getUserMfaStatus(user);

    return NextResponse.json(mfaStatus);
  } catch (error) {
    console.error("Error in mfa-status API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
