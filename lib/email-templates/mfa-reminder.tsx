import * as React from "react";

interface MfaReminderEmailProps {
  userName?: string;
}

export function MfaReminderEmail({ userName }: Readonly<MfaReminderEmailProps>) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
          color: "#0f172a",
          background: "#f8fafc",
          padding: 24,
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{
            maxWidth: 560,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <thead>
            <tr>
              <th scope="col" style={{ display: "none" }}>
                Email Content
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 24 }}>
                <h1 style={{ margin: 0, fontSize: 20 }}>
                  Secure your AccuFin account
                </h1>
                <p style={{ marginTop: 12, lineHeight: 1.6 }}>
                  {userName ? `Hi ${userName},` : "Hi,"}
                </p>
                <p style={{ marginTop: 8, lineHeight: 1.6 }}>
                  For your security, we recommend enabling an authenticator app
                  (TOTP) on your account. It reduces the risk of unauthorized
                  access and keeps your data protected.
                </p>
                <p style={{ marginTop: 8, lineHeight: 1.6 }}>
                  You can enable it anytime from your dashboard under{" "}
                  <strong>Multi-Factor Authentication</strong>.
                </p>
                <div style={{ marginTop: 20 }}>
                  <a
                    href={process.env.NEXTAUTH_URL || "https://accufin.app"}
                    style={{
                      display: "inline-block",
                      background: "#0ea5e9",
                      color: "#ffffff",
                      textDecoration: "none",
                      padding: "10px 16px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    Go to Dashboard
                  </a>
                </div>
                <p style={{ marginTop: 20, color: "#6b7280", fontSize: 12 }}>
                  If you have already enabled the authenticator, you can ignore
                  this email.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
