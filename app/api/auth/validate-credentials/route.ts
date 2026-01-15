import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter both email and password" },
        { status: 400 }
      );
    }
    const cleanEmail = email.toLowerCase() as string;
    const user = await prisma.user.findFirst({
      where: { email: {
        equals: cleanEmail,
        mode: "insensitive",
      } },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isActive: true,
        password: true,
      },
    });
    console.log("user in api/auth/validate-credentials/route.ts file :", user);
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: "Your account is inactive. Please contact support." },
        { status: 403 }
      );
    }

    const isValid = await compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Credentials validated successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Error in validate-credentials API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
