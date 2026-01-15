import React from "react";
import { Section, Text } from "@react-email/components";

export const colors = {
  white: "#ffffff",
  gray900: "#1f2937",
  gray700: "#374151",
  gray500: "#6b7280",
  gray200: "#e5e7eb",
  gray100: "#f3f4f6",
  blue500: "#3b82f6",
} as const;

export const baseText: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: colors.gray700,
  margin: "0 0 16px 0",
};

export const EmailSection = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => <Section style={style}>{children}</Section>;

export const EmailText = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => <Text style={style ?? baseText}>{children}</Text>;


