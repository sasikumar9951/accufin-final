import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { requireAdminSession, error } from "@/lib/api-helpers";
import { sendUserCreatedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized. Admin access required.", 401);

    const {
      email,
      password,
      name,
      sinNumber,
      businessNumber,
      dateOfBirth,
      contactNumber,
      isAdmin: isAdminIncoming,
      maxStorageLimit: maxStorageLimitIncoming,
    } = await req.json();

    if (!email || !password)
      return error("Email and password are required.", 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error("User already exists.", 409);

    const hashedPassword = await hash(password, 10);

    // Parse dateOfBirth if provided
    let parsedDateOfBirth: Date | null = null;
    if (dateOfBirth) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (Number.isNaN(parsedDateOfBirth.getTime())) {
        return error("Invalid date of birth format.", 400);
      }
    }

    const isAdmin = Boolean(isAdminIncoming);
    const maxStorageLimit =
      typeof maxStorageLimitIncoming === "number" && maxStorageLimitIncoming > 0
        ? Math.floor(maxStorageLimitIncoming)
        : undefined;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isAdmin: isAdmin,
        name,
        sinNumber,
        businessNumber,
        dateOfBirth: parsedDateOfBirth,
        contactNumber,
        ...(maxStorageLimit ? { maxStorageLimit } : {}),
        mfaEnabled: true,
        emailMfaEnabled: true,
        preferredMfaMethod: "email",
      },
      select: {
        id: true,
        email: true,
        name: true,
        sinNumber: true,
        businessNumber: true,
        dateOfBirth: true,
        isAdmin: true,
        createdAt: true,
        contactNumber: true,
      },
    });

    // Send welcome email to the newly created user
    try {
      const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;

      console.log("Attempting to send welcome email to:", email);
      console.log("Environment variables:", {
        NODEMAILER_EMAIL: process.env.NODEMAILER_EMAIL ? "Set" : "Not set",
        NODEMAILER_PASSKEY: process.env.NODEMAILER_PASSKEY ? "Set" : "Not set",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      });

      const emailResult = await sendUserCreatedEmail({
        userName: name || "User",
        userEmail: email,
        password: password,
        adminName: session.user.name || "Administrator",
        loginUrl,
      });

      if (emailResult.success) {
        console.log("Welcome email sent successfully to:", email);
      } else {
        console.error("Failed to send welcome email:", emailResult.error);
      }
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the user creation if email fails
    }

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Error creating user:", err);
    return error("Server error.", 500);
  }
}
