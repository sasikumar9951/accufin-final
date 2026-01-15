import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserMfaStatus, isValidMfaMethod } from "@/lib/mfa";

// Determine if user will have Email MFA enabled
async function willHaveEmailMfaEnabled(
  emailMfaEnabled: boolean | undefined,
  updateData: any,
  userId: string
): Promise<boolean> {
  if (emailMfaEnabled !== undefined) {
    return emailMfaEnabled;
  }

  if (updateData.emailMfaEnabled !== undefined) {
    return updateData.emailMfaEnabled;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailMfaEnabled: true },
  });

  return user?.emailMfaEnabled || false;
}

// Validate preferred MFA method
function validatePreferredMethod(
  preferredMfaMethod: string | null | undefined
): { error?: string } {
  if (
    preferredMfaMethod !== undefined &&
    preferredMfaMethod &&
    !isValidMfaMethod(preferredMfaMethod)
  ) {
    return { error: "Invalid MFA method" };
  }
  return {};
}

// Update email MFA settings
function updateEmailMfaSettings(
  emailMfaEnabled: boolean | undefined,
  updateData: any
) {
  if (emailMfaEnabled !== undefined) {
    updateData.emailMfaEnabled = emailMfaEnabled;
    if (emailMfaEnabled === true) {
      updateData.totpEnabled = false;
      updateData.totpSecret = null;
    }
  }
}

// Update SMS MFA settings
function updateSmsMfaSettings(
  smsEnabled: boolean | undefined,
  userContactNumber: string | null,
  updateData: any
): { error?: string } {
  if (smsEnabled !== undefined) {
    if (smsEnabled && !userContactNumber) {
      return { error: "Phone number required for SMS verification" };
    }
    updateData.smsEnabled = smsEnabled;
  }
  return {};
}

// Disable TOTP and switch to email MFA
function disableTotpSettings(
  disableTotp: boolean | undefined,
  userTotpEnabled: boolean,
  preferredMfaMethod: string | null | undefined,
  updateData: any
) {
  if (disableTotp && userTotpEnabled) {
    updateData.totpEnabled = false;
    updateData.totpSecret = null;
    updateData.emailMfaEnabled = true;

    if (preferredMfaMethod === undefined) {
      updateData.preferredMfaMethod = "email";
    }
  }
}

// Update MFA enabled status based on available methods
function updateMfaEnabledStatus(
  mfaMethodsStatus: {
    emailMfa: boolean;
    smsMfa: boolean;
    totpMfa: boolean;
  },
  updateData: any
) {
  const hasAnyMfaMethod =
    mfaMethodsStatus.emailMfa ||
    mfaMethodsStatus.smsMfa ||
    mfaMethodsStatus.totpMfa;

  if (hasAnyMfaMethod) {
    updateData.mfaEnabled = true;
  } else {
    updateData.mfaEnabled = false;
    if (!updateData.preferredMfaMethod) {
      updateData.preferredMfaMethod = null;
    }
  }
}

// GET - Retrieve user's MFA settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
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

    // Count unused backup codes
    const backupCodesCount = await prisma.mfaBackupCode.count({
      where: {
        userId: user.id,
        used: false,
      },
    });

    return NextResponse.json({
      ...mfaStatus,
      backupCodesCount,
      hasPhoneNumber: !!user.contactNumber,
    });
  } catch (error) {
    console.error("Error in MFA settings GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user's MFA settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { preferredMfaMethod, emailMfaEnabled, smsEnabled, disableTotp } =
      await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        totpEnabled: true,
        contactNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};

    // Validate and update preferred method
    if (preferredMfaMethod !== undefined) {
      const validation = validatePreferredMethod(preferredMfaMethod);
      if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      updateData.preferredMfaMethod = preferredMfaMethod;
    }

    // Update email MFA
    updateEmailMfaSettings(emailMfaEnabled, updateData);

    // Update SMS MFA (only if user has phone number)
    const smsValidation = updateSmsMfaSettings(
      smsEnabled,
      user.contactNumber,
      updateData
    );
    if (smsValidation.error) {
      return NextResponse.json({ error: smsValidation.error }, { status: 400 });
    }

    // Disable TOTP if requested
    disableTotpSettings(
      disableTotp,
      user.totpEnabled,
      preferredMfaMethod,
      updateData
    );

    // Check if any MFA method will remain enabled
    const willHaveEmailMfa = await willHaveEmailMfaEnabled(
      emailMfaEnabled,
      updateData,
      user.id
    );
    const willHaveSms = smsEnabled === true && !!user.contactNumber;
    const willHaveTotp = user.totpEnabled && !disableTotp;

    // Update MFA enabled status
    updateMfaEnabledStatus(
      {
        emailMfa: willHaveEmailMfa,
        smsMfa: willHaveSms,
        totpMfa: willHaveTotp,
      },
      updateData
    );

    // Update user settings
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        mfaEnabled: true,
        preferredMfaMethod: true,
        totpEnabled: true,
        smsEnabled: true,
        emailMfaEnabled: true,
        contactNumber: true,
      },
    });

    const mfaStatus = getUserMfaStatus(updatedUser);

    return NextResponse.json({
      message: "MFA settings updated successfully",
      ...mfaStatus,
    });
  } catch (error) {
    console.error("Error in MFA settings PUT API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
