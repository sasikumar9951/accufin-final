import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { AuthOptions } from "next-auth";
import prisma from "./prisma";
import GoogleProvider from "next-auth/providers/google";
import { sendLoginConfirmationEmail } from "./email";
import { verifyTotpToken, verifyBackupCode, cleanBackupCodeInput } from "./mfa";

// Validate user credentials
async function validateUserCredentials(email: string, password: string) {
  const cleanEmail = email.toLowerCase();
  console.log("cleanEmail in lib/auth.ts file :", cleanEmail);
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: cleanEmail,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      isActive: true,
      password: true,
      mfaEnabled: true,
      preferredMfaMethod: true,
      totpEnabled: true,
      totpSecret: true,
      smsEnabled: true,
      emailMfaEnabled: true,
      contactNumber: true,
    },
  });

  console.log("User in lib/auth.ts file :", user);

  if (!user) {
    throw new Error("No account found with this email");
  }

  if (user.isActive === false) {
    throw new Error("Your account is inactive. Please contact support.");
  }

  const isValid = await compare(password, user.password);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  return user;
}

// Create user return object
function createUserReturnObject(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    isAdmin: user.isAdmin,
  };
}

// Verify and use backup code
async function verifyAndUseBackupCode(userId: string, backupCode: string) {
  const cleanCode = cleanBackupCodeInput(backupCode);

  const backupCodes = await prisma.mfaBackupCode.findMany({
    where: {
      userId: userId,
      used: false,
    },
  });

  let validBackupCode: any = null;
  for (const code of backupCodes) {
    const isValid = await verifyBackupCode(cleanCode, code.hashedCode);
    if (isValid) {
      validBackupCode = code;
      break;
    }
  }

  if (!validBackupCode) {
    throw new Error("Invalid backup code");
  }

  await prisma.mfaBackupCode.update({
    where: { id: validBackupCode.id },
    data: {
      used: true,
      usedAt: new Date(),
    },
  });
}

// Verify TOTP authentication
function verifyTotpAuthentication(user: any, otp: string | undefined) {
  if (!otp) {
    throw new Error("Authenticator code required");
  }

  if (!user.totpSecret) {
    throw new Error("TOTP not properly configured");
  }

  const isValidTotp = verifyTotpToken(otp, user.totpSecret);
  if (!isValidTotp) {
    throw new Error("Invalid authenticator code");
  }
}

// Verify email MFA authentication
function verifyEmailMfa(otpVerified: string | undefined) {
  if (otpVerified !== "true") {
    throw new Error("Email verification required");
  }
}

// Handle MFA verification
async function handleMfaVerification(user: any, credentials: any) {
  if (!user.mfaEnabled) {
    return; // No MFA required
  }

  // Check if backup code is being used
  if (credentials.backupCode) {
    await verifyAndUseBackupCode(user.id, credentials.backupCode);
    return;
  }

  // Check which MFA method is enabled
  if (user.totpEnabled) {
    verifyTotpAuthentication(user, credentials.otp);
  } else if (user.emailMfaEnabled) {
    verifyEmailMfa(credentials.otpVerified);
  } else {
    throw new Error("No valid MFA method available");
  }
}

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        otpVerified: { label: "OTP Verified", type: "text" },
        mfaMethod: { label: "MFA Method", type: "text" },
        backupCode: { label: "Backup Code", type: "text" },
        backupCodeVerified: { label: "Backup Code Verified", type: "text" },
      },
      async authorize(credentials) {
        //login
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const user = await validateUserCredentials(
          credentials.email,
          credentials.password
        );

        // If backup code was already verified by API, allow login and skip all MFA
        if (credentials.backupCodeVerified === "true") {
          return createUserReturnObject(user);
        }

        // Handle MFA verification
        await handleMfaVerification(user, credentials);

        // If all verifications pass, proceed with login
        return createUserReturnObject(user);
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      //this is for google sign in
      if (account?.provider === "google") {
        let dbUser = await prisma.user.findFirst({
          where: {
            email: {
              equals: user.email?.toLowerCase(),
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            email: true,
            name: true,
            isAdmin: true,
            isActive: true,
            profileUrl: true,
          },
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email?.toLowerCase(),
              name: user.name || "",
              isAdmin: false,
              password: "",
              provider: "google",
              profileUrl:
                user.image && user.image.startsWith("https://")
                  ? user.image
                  : null, // Validate Google profile image URL
            },
            select: {
              id: true,
              email: true,
              name: true,
              isAdmin: true,
              isActive: true,
              profileUrl: true,
            },
          });
          try {
            const loginTime = new Date().toLocaleString();
            await sendLoginConfirmationEmail({
              userName: user.name || "User",
              userEmail: user.email,
              loginTime,
              loginMethod: "Google OAuth",
            });
          } catch (emailError) {
            console.error(
              "Error sending login confirmation email:",
              emailError
            );
            // Don't fail login if email fails
          }
        } else {
          // For existing Google users, update their profile image if it's not set and we have one from Google
          if (
            !dbUser.profileUrl &&
            user.image &&
            user.image.startsWith("https://")
          ) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { profileUrl: user.image },
            });
            dbUser.profileUrl = user.image;
          }
        }

        user.id = dbUser.id;
        user.isAdmin = dbUser.isAdmin;
        user.name = dbUser.name;
        user.email = dbUser.email;
        (user as any).profileUrl = dbUser.profileUrl;

        if (dbUser.isActive === false) {
          return "/login?inactive=1";
        }

        // Send login confirmation email for Google login
      }
      return true;
    },
    async jwt({ token, user }) {
      //frontend jwt callback
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.isAdmin = user.isAdmin;
        token.email = user.email;
        token.profileUrl = (user as any).profileUrl;
      }
      return token;
    },
    async session({ session, token }) {
      //session session callback
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name as string;
        session.user.email = token.email;
        session.user.isAdmin = token.isAdmin;
        (session.user as any).profileUrl = token.profileUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds (increased from 15 minutes)
    updateAge: 24 * 60 * 60, // refresh token every 24 hours of activity
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds (increased from 15 minutes)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
