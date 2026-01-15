import React from "react";
import { Html, Head, Body, Container, Link, Hr } from "@react-email/components";
import { colors, EmailSection, EmailText, baseText } from "./common";

interface UserCreatedEmailProps {
  userName: string;
  userEmail: string;
  password: string;
  adminName: string;
  loginUrl: string;
}



export const UserCreatedEmail = ({
  userName,
  userEmail,
  password,
  adminName,
  loginUrl,
}: UserCreatedEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <EmailSection style={header}>
            <EmailText style={logo}>AccuFin</EmailText>
          </EmailSection>

          <EmailSection style={content}>
            <EmailText style={title}>Welcome to AccuFin!</EmailText>

            <EmailText>Hello {userName},</EmailText>

            <EmailText>
              Your account has been successfully created by {adminName}. You can
              now access your AccuFin dashboard and start managing your
              financial documents and forms.
            </EmailText>

            <EmailText>Your login credentials:</EmailText>

            <EmailText style={credentials}>Email: {userEmail}</EmailText>
            <EmailText style={credentials}>Password: {password}</EmailText>

            <EmailText>
              Please use the password that was provided to you by the
              administrator to log in to your account.
            </EmailText>

            <EmailSection style={buttonContainer}>
              <Link href={loginUrl} style={button}>
                Login to Your Account
              </Link>
            </EmailSection>

            <EmailText>
              If you have any questions or need assistance, please don't
              hesitate to contact our support team.
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

const credentials = {
  ...text,
  padding: "12px 16px",
  backgroundColor: colors.gray100,
  borderRadius: "6px",
  border: `1px solid #d1d5db`,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: colors.blue500,
  borderRadius: "6px",
  color: colors.white,
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
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

export default UserCreatedEmail;
