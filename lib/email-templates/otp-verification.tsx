import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OtpVerificationEmailProps {
  userName: string;
  otp: string;
  purpose: string; // "login" or "signup"
}

// Helper function to get the appropriate heading
function getHeading(purpose: string): string {
  if (purpose === "signup") {
    return "Welcome to AccuFin!";
  }
  if (purpose === "password-change") {
    return "Password Change Verification";
  }
  return "Sign In Verification";
}

// Helper function to get the main message
function getMainMessage(purpose: string): string {
  if (purpose === "signup") {
    return "Thank you for signing up with AccuFin! To complete your registration and verify your email address, please use the verification code below:";
  }
  if (purpose === "password-change") {
    return "We received a request to change your password for your AccuFin account. To proceed with the password change, please use the verification code below:";
  }
  return "We received a sign-in request for your AccuFin account. To complete your login, please use the verification code below:";
}

// Helper function to get the action type for warning message
function getActionType(purpose: string): string {
  if (purpose === "signup") {
    return "account creation";
  }
  if (purpose === "password-change") {
    return "password change";
  }
  return "sign-in";
}

export const OtpVerificationEmail = ({
  userName,
  otp,
  purpose,
}: Readonly<OtpVerificationEmailProps>) => (
  <Html>
    <Head />
    <Preview>Your AccuFin verification code: {otp}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <div style={logoPlaceholder}>AccuFin</div>
        </Section>

        <Heading style={h1}>
          {getHeading(purpose)}
        </Heading>

        <Text style={text}>Hello {userName},</Text>

        <Text style={text}>
          {getMainMessage(purpose)}
        </Text>

        <Section style={otpContainer}>
          <Text style={otpCode}>{otp}</Text>
        </Section>

        <Text style={text}>
          This code will expire in <strong>3 minutes</strong> for security
          reasons.
        </Text>

        <Text style={text}>
          If you didn't request this {getActionType(purpose)}, please ignore
          this email and contact our support team if you have concerns.
        </Text>

        <Text style={text}>
          For security reasons, please don't share this code with anyone.
        </Text>

        <Text style={footer}>
          Best regards,
          <br />
          The AccuFin Team
          <br />
          <Text style={supportText}>
            Need help? Contact us at info.accufin@gmail.com
          </Text>
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "580px",
};

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logoPlaceholder = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#007399",
  textAlign: "center" as const,
  padding: "16px 0",
};

const h1 = {
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "24px 0 12px",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "12px 24px",
};

const otpContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
  padding: "24px",
  backgroundColor: "#f8fafc",
  border: "2px dashed #007399",
  borderRadius: "8px",
};

const otpCode = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#007399",
  letterSpacing: "8px",
  margin: "0",
  fontFamily: "monospace",
};

const footer = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "24px 24px 0",
  textAlign: "center" as const,
};

const supportText = {
  color: "#007399",
  fontSize: "11px",
  margin: "8px 0 0",
};
