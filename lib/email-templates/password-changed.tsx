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

interface PasswordChangedEmailProps {
  userName: string;
  userEmail: string;
  changeTime: string;
}

export const PasswordChangedEmail = ({
  userName,
  userEmail,
  changeTime,
}: PasswordChangedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your AccuFin password has been changed</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* <Section style={logoContainer}>
          <img
            src="https://accufin-public-assets.s3.amazonaws.com/image-000.png"
            alt="AccuFin"
            style={logo}
          />
        </Section> */}
        <Heading style={h1}>Password Changed Successfully</Heading>

        <Text style={text}>Hello {userName},</Text>

        <Text style={text}>
          This email confirms that your password for your AccuFin account has been successfully changed.
        </Text>

        <Section style={infoContainer}>
          <Text style={infoText}>
            <strong>Account:</strong> {userEmail}
          </Text>
          <Text style={infoText}>
            <strong>Changed on:</strong> {changeTime}
          </Text>
        </Section>

        <Text style={text}>
          If you did not make this change, please contact our support team immediately 
          as your account may have been compromised.
        </Text>

        <Text style={securityText}>
          For your security, we recommend:
        </Text>
        <ul style={list}>
          <li style={listItem}>Using a strong, unique password</li>
          <li style={listItem}>Regularly reviewing your account activity</li>
        </ul>

        <Text style={footerText}>
          If you have any questions or concerns, please don't hesitate to contact 
          our support team.
        </Text>

        <Text style={footerText}>
          Best regards,<br />
          The AccuFin Team
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
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 8px",
};

const infoContainer = {
  background: "#f8f9fa",
  border: "1px solid #e9ecef",
  borderRadius: "8px",
  margin: "24px 8px",
  padding: "16px",
};

const infoText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "4px 0",
};

const securityText = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "26px",
  margin: "24px 8px 8px",
};

const list = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "8px 8px 16px",
  paddingLeft: "16px",
};

const listItem = {
  margin: "4px 0",
};

const footerText = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 8px",
};