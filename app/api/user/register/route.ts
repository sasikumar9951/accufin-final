import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, lastName, contactNumber } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    const cleanEmail = email.toLowerCase() as string;
    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists." },
        { status: 409 }
      );
    }
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        isAdmin: false,
        name: name + " " + lastName,
        contactNumber,
        mfaEnabled: true,
        emailMfaEnabled: true,
        preferredMfaMethod: "email",
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        contactNumber: true,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Error registering user:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
