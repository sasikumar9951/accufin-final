import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendOtpVerificationEmail } from "@/lib/email";
import crypto from "node:crypto";

// Generate a 6-digit OTP using cryptographically secure randomness
function generateOTP(): string {
  // randomInt upper bound is exclusive; 0..999999 inclusive
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, "0");
}

// Configurable OTP expiration time in seconds (default: 180 seconds / 3 minutes)
// Can be configured via environment variable OTP_EXPIRY_SECONDS
const OTP_EXPIRY_SECONDS = Number.parseInt("180");

// Validate request payload
function validateRequestPayload(
  email: string,
  purpose: string,
  currentPassword?: string,
  newPassword?: string
): { isValid: boolean; error?: string } {
  if (!email || !purpose) {
    return { isValid: false, error: "Email and purpose are required" };
  }

  if (!["login", "signup", "password-change"].includes(purpose)) {
    return {
      isValid: false,
      error: "Invalid purpose. Must be 'login', 'signup', or 'password-change'",
    };
  }

  if (purpose === "password-change" && (!currentPassword || !newPassword)) {
    return {
      isValid: false,
      error: "Current password and new password are required for password change",
    };
  }

  return { isValid: true };
}

// Check rate limiting for OTP requests
async function checkRateLimit(email: string): Promise<{ allowed: boolean; retryAfter?: number; error?: string }> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentAttempts = await prisma.rateLimit.findMany({
    where: {
      identifier: email,
      action: "send_otp",
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
    const oldestAttempt = recentAttempts.at(-1) ?? null;
    if (!oldestAttempt) {
      return { allowed: true };
    }
    const timeUntilReset =
      60 - Math.floor((Date.now() - oldestAttempt.createdAt.getTime()) / 1000);

    return {
      allowed: false,
      retryAfter: timeUntilReset,
      error: `Too many OTP requests. Please try again in ${timeUntilReset} seconds.`,
    };
  }

  return { allowed: true };
}

// Validate user existence and status based on purpose
async function validateUserForPurpose(
  email: string,
  purpose: string
): Promise<{ isValid: boolean; user?: any; error?: string }> {
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
      ...(purpose === "password-change" && { password: true }),
    },
  });

  if (purpose === "login" && !user) {
    return { isValid: false, error: "No account found with this email" };
  }

  if ((purpose === "login" || purpose === "password-change") && !user?.isActive) {
    return { isValid: false, error: "Account is inactive. Please contact support." };
  }

  if (purpose === "signup" && user) {
    return { isValid: false, error: "Account already exists with this email" };
  }

  if (purpose === "password-change" && !user) {
    return { isValid: false, error: "No account found with this email" };
  }

  return { isValid: true, user };
}

// Validate password change requirements
async function validatePasswordChange(
  user: any,
  currentPassword: string,
  newPassword: string
): Promise<{ isValid: boolean; error?: string }> {
  const isPasswordCorrect = await compare(currentPassword, user.password);

  if (!isPasswordCorrect) {
    return { isValid: false, error: "Incorrect current password" };
  }

  const isSamePassword = await compare(newPassword, user.password);

  if (isSamePassword) {
    return {
      isValid: false,
      error: "New password must be different from current password",
    };
  }

  return { isValid: true };
}

// Create or get user for OTP process
async function createOrGetUser(
  purpose: string,
  email: string,
  user?: any
): Promise<{ userId: string; userName: string }> {
  let userId = user?.id;
  let userName = user?.name || email.split("@")[0];

  if (purpose === "signup") {
    const tempUser = await prisma.user.upsert({
      where: { email },
      update: {}, // Don't update if exists
      create: {
        email,
        name: userName,
        password: "", // Will be set during registration
        isActive: false, // Mark as inactive until registration is complete
        provider: "credentials",
      },
      select: { id: true },
    });
    userId = tempUser.id;
  }

  return { userId, userName };
}

// Store OTP token in database
async function storeOTPToken(
  userId: string,
  purpose: string,
  otp: string
): Promise<void> {
  const hashedOtp = await hash(otp, 12);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

  // Clean up old OTP tokens for this user
  await prisma.otpToken.deleteMany({
    where: {
      userId,
      purpose,
    },
  });

  // Store the hashed OTP
  await prisma.otpToken.create({
    data: {
      hashedOtp,
      expiresAt,
      purpose,
      userId,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email, purpose, currentPassword, newPassword } = await request.json();

    // Validate request payload
    const payloadValidation = validateRequestPayload(email, purpose, currentPassword, newPassword);
    if (!payloadValidation.isValid) {
      return NextResponse.json({ error: payloadValidation.error }, { status: 400 });
    }

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.error,
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      );
    }

    // Validate user for the given purpose
    const userValidation = await validateUserForPurpose(email, purpose);
    if (!userValidation.isValid) {
      let statusCode = 404; // Default for "not found"
      if (userValidation.error?.includes("already exists")) {
        statusCode = 409;
      } else if (userValidation.error?.includes("inactive")) {
        statusCode = 403;
      }
      return NextResponse.json({ error: userValidation.error }, { status: statusCode });
    }

    // For password-change, validate current and new passwords
    if (purpose === "password-change" && userValidation.user && currentPassword && newPassword) {
      const passwordValidation = await validatePasswordChange(userValidation.user, currentPassword, newPassword);
      if (!passwordValidation.isValid) {
        return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
      }
    }

    // Create or get user
    const { userId, userName } = await createOrGetUser(purpose, email, userValidation.user);

    // Generate and store OTP
    const otp = generateOTP();
    await storeOTPToken(userId, purpose, otp);

    // Send OTP via email
    const emailResult = await sendOtpVerificationEmail({
      userEmail: email,
      userName,
      otp,
      purpose: purpose as "login" | "signup" | "password-change",
    });

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    // Record rate limit attempt after successful email send
    await prisma.rateLimit.create({
      data: {
        identifier: email,
        action: "send_otp",
      },
    });

    return NextResponse.json({
      message: "OTP sent successfully",
      email,
      purpose,
    });
  } catch (error) {
    console.error("Error in send-otp API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
