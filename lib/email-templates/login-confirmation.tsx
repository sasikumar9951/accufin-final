import React from "react";
import { Html, Head, Body, Container, Text, Hr } from "@react-email/components";
import { colors, EmailSection, EmailText, baseText } from "./common";

interface LoginConfirmationEmailProps {
  userName: string;
  userEmail: string;
  loginTime: string;
  loginMethod: string;
}

// Helpers moved to common.tsx

const LoginDetails = ({
  userEmail,
  loginTime,
  loginMethod,
}: {
  userEmail: string;
  loginTime: string;
  loginMethod: string;
}) => (
  <Text style={details}>
    Email: {userEmail}
    <br />
    Login Time: {loginTime}
    <br />
    Login Method: {loginMethod}
  </Text>
);

export const LoginConfirmationEmail = ({
  userName,
  userEmail,
  loginTime,
  loginMethod,
}: LoginConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <EmailSection style={header}>
            <EmailText style={logo}>AccuFin</EmailText>
          </EmailSection>

          <EmailSection style={content}>
            <EmailText style={title}>Login Confirmation</EmailText>

            <EmailText>Hello {userName},</EmailText>

            <EmailText>
              We're confirming that you have successfully logged into your
              AccuFin account.
            </EmailText>

            <EmailText>
              <strong>Login Details:</strong>
            </EmailText>

            <LoginDetails
              userEmail={userEmail}
              loginTime={loginTime}
              loginMethod={loginMethod}
            />

            <EmailText>
              If this was you, no action is required. If you didn't log in to
              your account, please contact our support team immediately.
            </EmailText>

            <EmailText>
              Best regards,
              <br />
              The AccuFin Team
            </EmailText>
          </EmailSection>

          <Hr style={hr} />

          <EmailSection style={footer}>
            <EmailText style={footerText}>
              This email was sent to {userEmail}. If you didn't expect this
              email, please contact support.
            </EmailText>
          </EmailSection>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: colors.white,
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "40px",
};

const logo = {
  fontSize: "32px",
  fontWeight: "bold",
  color: colors.gray900,
  margin: "0",
};

const content = {
  padding: "0 40px",
};

const title = {
  fontSize: "24px",
  fontWeight: "bold",
  color: colors.gray900,
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const text = baseText;

const details = {
  ...text,
  padding: "12px 16px",
  backgroundColor: colors.gray100,
  borderRadius: "6px",
  border: "1px solid #d1d5db",
};

const hr = {
  borderColor: colors.gray200,
  margin: "20px 0",
};

const footer = {
  padding: "0 40px",
};

const footerText = {
  fontSize: "14px",
  color: colors.gray500,
  textAlign: "center" as const,
  margin: "0",
};

export default LoginConfirmationEmail;
