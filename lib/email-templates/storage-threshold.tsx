import * as React from "react";
import { Html, Head, Preview, Body, Container } from "@react-email/components";
import { colors, EmailSection, EmailText, baseText } from "./common";

interface StorageThresholdEmailProps {
  userName?: string;
  percent: number; // exact integer percent (0-100)
  usedKB: number;
  limitKB: number;
}

function formatKBToReadable(kb: number): string {
  if (kb >= 1024 * 1024) {
    const gb = kb / (1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  }
  if (kb >= 1024) {
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }
  return `${kb} KB`;
}

export function StorageThresholdEmail({
  userName,
  percent,
  usedKB,
  limitKB,
}: Readonly<StorageThresholdEmailProps>) {
  const readableUsed = formatKBToReadable(usedKB);
  const readableLimit = formatKBToReadable(limitKB);
  const isFull = percent >= 100;
  const title = isFull
    ? "Your storage is full"
    : `You're at ${percent}% of your storage limit`;
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={{ backgroundColor: colors.white, fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px" }}>
          <EmailSection>
            <EmailText style={{ ...baseText, fontSize: 18, fontWeight: 600, margin: 0 }}>
              {isFull ? "Storage Full" : "High Storage Usage"}
            </EmailText>
            <EmailText style={{ ...baseText, marginTop: 12 }}>
              {userName ? `Hi ${userName},` : "Hello,"}
            </EmailText>
            <EmailText>
              {isFull
                ? "You've reached your storage capacity. New uploads may fail until you free up space"
                : "You're approaching your storage limit. Consider freeing up space to avoid interruptions."}
            </EmailText>
            <EmailText>
              Usage: <strong>{readableUsed}</strong> of <strong>{readableLimit}</strong> ({percent}%)
            </EmailText>
            <EmailText style={{ ...baseText, color: "#555" }}>
              You can delete old files or contact support to upgrade your storage limit.
            </EmailText>
          </EmailSection>
        </Container>
      </Body>
    </Html>
  );
}

export default StorageThresholdEmail;


