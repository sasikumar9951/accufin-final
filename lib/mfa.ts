import { authenticator } from "otplib";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { hash, compare } from "bcryptjs";
import crypto from "node:crypto";

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 1 step before/after current time
  step: 30, // 30-second time step
};

const SECRET_MFA_ENCRYPTION_KEY =
  process.env.SECRET_MFA_ENCRYPTION_KEY ||
  "your-secret-key-change-in-production";

/**
 * Encrypt TOTP secret before storing in database
 */
export function encryptTotpSecret(secret: string): string {
  return CryptoJS.AES.encrypt(secret, SECRET_MFA_ENCRYPTION_KEY).toString();
}

/**
 * Decrypt TOTP secret from database
 */
export function decryptTotpSecret(encryptedSecret: string): string {
  const bytes = CryptoJS.AES.decrypt(
    encryptedSecret,
    SECRET_MFA_ENCRYPTION_KEY
  );
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Generate a new TOTP secret for a user
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code URL for authenticator app setup
 */
export function generateQrCodeUrl(
  userEmail: string,
  secret: string,
  serviceName: string = "AccuFin"
): string {
  return authenticator.keyuri(userEmail, serviceName, secret);
}

/**
 * Generate QR code image as base64 data URL
 */
export async function generateQrCodeImage(otpAuthUrl: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Verify TOTP token from authenticator app
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    const decryptedSecret = decryptTotpSecret(secret);
    return authenticator.verify({ token, secret: decryptedSecret });
  } catch (error) {
    console.error("Error verifying TOTP token:", error);
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code using secure randomness
    const bytes = crypto.randomBytes(8);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // Crockford-like, avoids confusing chars
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += alphabet[bytes[j] % alphabet.length];
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup codes before storing in database
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashedCodes = await Promise.all(codes.map((code) => hash(code, 12)));
  return hashedCodes;
}

/**
 * Verify backup code against hashed version
 */
export async function verifyBackupCode(
  code: string,
  hashedCode: string
): Promise<boolean> {
  try {
    return await compare(code.toUpperCase(), hashedCode);
  } catch (error) {
    console.error("Error verifying backup code:", error);
    return false;
  }
}

/**
 * Format backup codes for display (add dashes for readability)
 */
export function formatBackupCodes(codes: string[]): string[] {
  return codes.map((code) => {
    // Add dash in middle: ABCD1234 -> ABCD-1234
    if (code.length === 8) {
      return `${code.substring(0, 4)}-${code.substring(4)}`;
    }
    return code;
  });
}

/**
 * Clean backup code input (remove dashes, convert to uppercase)
 */
export function cleanBackupCodeInput(code: string): string {
  return code.replaceAll("-", "").toUpperCase().trim();
}

/**
 * Validate MFA method
 */
export function isValidMfaMethod(
  method: string
): method is "email" | "sms" | "authenticator" {
  return ["email", "sms", "authenticator"].includes(method);
}

/**
 * Generate secure random string for temporary tokens
 */
export function generateSecureToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Check if user has any MFA method enabled
 */
export interface MfaStatus {
  mfaEnabled: boolean;
  emailMfaEnabled: boolean;
  smsEnabled: boolean;
  totpEnabled: boolean;
  preferredMethod: string | null;
  availableMethods: string[];
}

export function getUserMfaStatus(user: {
  mfaEnabled: boolean;
  emailMfaEnabled: boolean;
  smsEnabled: boolean;
  totpEnabled: boolean;
  preferredMfaMethod: string | null;
  contactNumber: string | null;
}): MfaStatus {
  const availableMethods: string[] = [];

  if (user.emailMfaEnabled) availableMethods.push("email");
  if (user.smsEnabled && user.contactNumber) availableMethods.push("sms");
  if (user.totpEnabled) availableMethods.push("authenticator");

  return {
    mfaEnabled: user.mfaEnabled,
    emailMfaEnabled: user.emailMfaEnabled,
    smsEnabled: user.smsEnabled,
    totpEnabled: user.totpEnabled,
    preferredMethod: user.preferredMfaMethod,
    availableMethods,
  };
}
