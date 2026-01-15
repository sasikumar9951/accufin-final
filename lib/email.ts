import transporter from "./nodemailer";
import { render } from "@react-email/components";
import { UserCreatedEmail } from "./email-templates/user-created";
import { LoginConfirmationEmail } from "./email-templates/login-confirmation";
import { ContactFormEmail } from "./email-templates/contact-form";
import { PasswordResetEmail } from "./email-templates/password-reset";
import { OtpVerificationEmail } from "./email-templates/otp-verification";
import { PasswordChangedEmail } from "./email-templates/password-changed";
import { birthdayWishTemplate } from "./email-templates/birthday-wish";
import { MfaReminderEmail } from "./email-templates/mfa-reminder";
import { PermanentDeletionUserEmail } from "./email-templates/permanent-deletion-user";
import { PermanentDeletionAdminEmail } from "./email-templates/permanent-deletion-admin";
import { StorageThresholdEmail } from "./email-templates/storage-threshold";

export interface SendUserCreatedEmailParams {
  userName: string;
  userEmail: string;
  password: string;
  adminName: string;
  loginUrl: string;
}

export interface SendLoginConfirmationEmailParams {
  userName: string;
  userEmail: string;
  loginTime: string;
  loginMethod: string;
}

export interface SendContactFormEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export interface SendPasswordResetEmailParams {
  userEmail: string;
  userName: string;
  resetToken: string;
}

export interface SendOtpVerificationEmailParams {
  userEmail: string;
  userName: string;
  otp: string;
  purpose: "login" | "signup" | "password-change";
}

export interface SendPasswordChangedEmailParams {
  userEmail: string;
  userName: string;
  changeTime: string;
}

export interface SendBirthdayWishEmailParams {
  userEmail: string;
  userName?: string;
}

export async function sendUserCreatedEmail({
  userName,
  userEmail,
  password,
  adminName,
  loginUrl,
}: SendUserCreatedEmailParams) {
  try {
    console.log("Email utility - Starting to send email to:", userEmail);
    console.log("Email utility - From email:", process.env.NODEMAILER_EMAIL);

    // Render the React email template to HTML
    const emailHtml = await render(
      UserCreatedEmail({
        userName,
        userEmail,
        password,
        adminName,
        loginUrl,
      })
    );

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: userEmail,
      subject: "Welcome to AccuFin - Your Account Has Been Created",
      html: emailHtml,
    };

    console.log("Email utility - Email data prepared:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions as any);

    console.log("Email utility - Nodemailer response:", result);
    console.log(`Welcome email sent successfully to ${userEmail}`);
    return { success: true, result };
  } catch (error) {
    console.error("Email utility - Error sending welcome email:", error);
    return { success: false, error };
  }
}

export interface SendStorageThresholdEmailParams {
  userEmail: string;
  userName?: string;
  percent: number; // 90 or 100+
  usedKB: number;
  limitKB: number;
}

export async function sendStorageThresholdEmail({
  userEmail,
  userName,
  percent,
  usedKB,
  limitKB,
}: SendStorageThresholdEmailParams) {
  try {
    const emailHtml = await render(
      StorageThresholdEmail({ userName, percent, usedKB, limitKB }) as any
    );

    const subject =
      percent >= 100
        ? "AccuFin - Your storage is full"
        : `AccuFin - You're at ${percent}% of your storage limit`;

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: userEmail,
      subject,
      html: emailHtml,
    } as any;

    const result = await transporter.sendMail(mailOptions);
    return { success: true, result };
  } catch (error) {
    console.error("Email utility - Error sending storage threshold email:", error);
    return { success: false, error };
  }
}

export async function sendContactFormEmail({
  name,
  email,
  subject,
  message,
  submittedAt,
}: SendContactFormEmailParams) {
  try {
    console.log("Email utility - Starting to send contact form email to admin");

    // Render the React email template to HTML
    const emailHtml = await render(
      ContactFormEmail({
        name,
        email,
        subject,
        message,
        submittedAt,
      })
    );

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Form Submission - ${subject}`,
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(
      "Email utility - Contact form email sent successfully to admin"
    );
    return { success: true, result };
  } catch (error) {
    console.error("Email utility - Error sending contact form email:", error);
    return { success: false, error };
  }
}

export async function sendLoginConfirmationEmail({
  userName,
  userEmail,
  loginTime,
  loginMethod,
}: SendLoginConfirmationEmailParams) {
  try {
    console.log(
      "Email utility - Starting to send login confirmation email to:",
      userEmail
    );

    // Render the React email template to HTML
    const emailHtml = await render(
      LoginConfirmationEmail({
        userName,
        userEmail,
        loginTime,
        loginMethod,
      })
    );

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: userEmail,
      subject: "AccuFin - Login Confirmation",
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(
      "Email utility - Login confirmation email sent successfully to:",
      userEmail
    );
    return { success: true, result };
  } catch (error) {
    console.error(
      "Email utility - Error sending login confirmation email:",
      error
    );
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail({
  userEmail,
  userName,
  resetToken,
}: SendPasswordResetEmailParams) {
  try {
    console.log(
      "Email utility - Starting to send password reset email to:",
      userEmail
    );

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    // Render the React email template to HTML
    const emailHtml = await render(
      PasswordResetEmail({
        userName,
        resetUrl,
      })
    );

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: userEmail,
      subject: "AccuFin - Password Reset Request",
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(
      "Email utility - Password reset email sent successfully to:",
      userEmail
    );
    return { success: true, result };
  } catch (error) {
    console.error("Email utility - Error sending password reset email:", error);
    return { success: false, error };
  }
}

export async function sendOtpVerificationEmail({
  userEmail,
  userName,
  otp,
  purpose,
}: SendOtpVerificationEmailParams) {
  try {
    console.log(
      "Email utility - Starting to send OTP verification email to:",
      userEmail
    );

    // Render the React email template to HTML
    const emailHtml = await render(
      OtpVerificationEmail({
        userName,
        otp,
        purpose,
      })
    );

    const subjectText =
      purpose === "signup"
        ? "AccuFin - Verify Your Account"
        : "AccuFin - Sign In Verification Code";

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: userEmail,
      subject: subjectText,
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(
      "Email utility - OTP verification email sent successfully to:",
      userEmail
    );
    return { success: true, result };
  } catch (error) {
    console.error(
      "Email utility - Error sending OTP verification email:",
      error
    );
    return { success: false, error };
  }
}

export async function sendPasswordChangedEmail({
  userEmail,
  userName,
  changeTime,
}: SendPasswordChangedEmailParams) {
  try {
    console.log(
      "Email utility - Starting to send password changed notification to:",
      userEmail
    );

    // Render the React email template to HTML
    const emailHtml = await render(
      PasswordChangedEmail({
        userEmail,
        userName,
        changeTime,
      })
    );

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: userEmail,
      subject: "AccuFin - Password Changed Successfully",
      html: emailHtml,
    };

    console.log("Email utility - Password changed email data prepared:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions as any);

    console.log("Email utility - Nodemailer response:", result);
    console.log(
      "Email utility - Password changed notification sent successfully to:",
      userEmail
    );
    return { success: true, result };
  } catch (error) {
    console.error(
      "Email utility - Error sending password changed notification:",
      error
    );
    return { success: false, error };
  }
}

export async function sendBirthdayWishEmail({
  userEmail,
  userName,
}: SendBirthdayWishEmailParams) {
  try {
    const { subject, html } = birthdayWishTemplate({ name: userName });

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: userEmail,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions as any);
    return { success: true, result };
  } catch (error) {
    console.error("Email utility - Error sending birthday wish:", error);
    return { success: false, error };
  }
}

export interface SendMfaReminderEmailParams {
  userEmail: string;
  userName?: string;
}

export async function sendMfaReminderEmail({
  userEmail,
  userName,
}: SendMfaReminderEmailParams) {
  try {
    const emailHtml = await render(MfaReminderEmail({ userName }) as any);

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: userEmail,
      subject: "AccuFin - Secure your account with an Authenticator",
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions as any);
    return { success: true, result };
  } catch (error) {
    console.error("Email utility - Error sending MFA reminder:", error);
    return { success: false, error };
  }
}

export async function sendPermanentDeletionEmailToUser({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName?: string;
}) {
  try {
    const emailHtml = await render(
      PermanentDeletionUserEmail({ userName }) as any
    );
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: userEmail,
      subject: "AccuFin - Your account has been permanently deleted",
      html: emailHtml,
    };
    const result = await transporter.sendMail(mailOptions as any);
    return { success: true, result };
  } catch (error) {
    console.error(
      "Email utility - Error sending permanent deletion email to user:",
      error
    );
    return { success: false, error };
  }
}

export async function sendPermanentDeletionEmailToAdmin({
  userEmail,
  userName,
}: {
  userEmail?: string;
  userName?: string;
}) {
  try {
    const emailHtml = await render(
      PermanentDeletionAdminEmail({ userEmail, userName }) as any
    );
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: "AccuFin - A user was permanently deleted",
      html: emailHtml,
    };
    const result = await transporter.sendMail(mailOptions as any);
    return { success: true, result };
  } catch (error) {
    console.error(
      "Email utility - Error sending permanent deletion email to admin:",
      error
    );
    return { success: false, error };
  }
}

export async function sendPermanentDeletionEmailToSpecificAdmin({
  adminEmail,
  userEmail,
  userName,
}: {
  adminEmail: string;
  userEmail?: string;
  userName?: string;
}) {
  try {
    const emailHtml = await render(
      PermanentDeletionAdminEmail({ userEmail, userName }) as any
    );
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: adminEmail,
      subject: "AccuFin - A user was permanently deleted",
      html: emailHtml,
    } as any;
    const result = await transporter.sendMail(mailOptions);
    return { success: true, result };
  } catch (error) {
    console.error(
      "Email utility - Error sending permanent deletion email to specific admin:",
      error
    );
    return { success: false, error };
  }
}
