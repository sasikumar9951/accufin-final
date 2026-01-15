import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface ContactFormEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export const ContactFormEmail = ({
  name,
  email,
  subject,
  message,
  submittedAt,
}: ContactFormEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Contact Form Submission - AccuFin Services</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Contact Form Submission</Heading>

          <Section style={section}>
            <Text style={text}>
              A new contact form has been submitted on the AccuFin website.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Row>
              <Column style={labelColumn}>
                <Text style={label}>Name:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{name}</Text>
              </Column>
            </Row>

            <Row>
              <Column style={labelColumn}>
                <Text style={label}>Email:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{email}</Text>
              </Column>
            </Row>

            <Row>
              <Column style={labelColumn}>
                <Text style={label}>Subject:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{subject}</Text>
              </Column>
            </Row>

            <Row>
              <Column style={labelColumn}>
                <Text style={label}>Message:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{message}</Text>
              </Column>
            </Row>

            <Row>
              <Column style={labelColumn}>
                <Text style={label}>Submitted At:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{submittedAt}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Text style={footer}>
              This message was sent from the contact form on the AccuFin
              website. Please respond to the customer at {email} if needed.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f7f9fa",
  fontFamily: "Arial, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const h1 = {
  color: "#0a2236",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const section = {
  margin: "20px 0",
};

const text = {
  color: "#5a6a7a",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 10px 0",
};

const hr = {
  borderColor: "#e1e5e9",
  margin: "20px 0",
};

const labelColumn = {
  width: "120px",
  paddingRight: "20px",
};

const valueColumn = {
  flex: 1,
};

const label = {
  color: "#008db3",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0",
};

const value = {
  color: "#0a2236",
  fontSize: "14px",
  margin: "0",
  lineHeight: "20px",
};

const footer = {
  color: "#5a6a7a",
  fontSize: "12px",
  fontStyle: "italic",
  textAlign: "center" as const,
  margin: "20px 0 0 0",
};
