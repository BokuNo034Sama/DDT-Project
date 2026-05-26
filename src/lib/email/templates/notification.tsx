import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface NotificationEmailProps {
  labName: string;
  type: "task_assigned" | "proof_failed";
  title: string;
  message: string;
  actionUrl: string;
  actionText: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const NotificationEmail = ({
  labName,
  type,
  title,
  message,
  actionUrl,
  actionText,
}: NotificationEmailProps) => {
  const previewText = `${title} - DDT Structure`;
  
  const isError = type === "proof_failed";
  const headerColor = isError ? "#EF4444" : "#F59E0B";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={{ ...labNameText, color: headerColor }}>{labName}</Text>
          <Heading style={h1}>{title}</Heading>
          
          <Text style={text}>{message}</Text>
          
          <Section style={btnContainer}>
            <Button style={{ ...button, backgroundColor: headerColor }} href={actionUrl}>
              {actionText}
            </Button>
          </Section>
          
          <Text style={textMuted}>
            You are receiving this email because you have notifications enabled for these events.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#0C1220",
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
  padding: "40px 0",
};

const container = {
  backgroundColor: "#141C2E",
  border: "1px solid #2A3550",
  borderRadius: "8px",
  margin: "0 auto",
  padding: "40px",
  maxWidth: "600px",
};

const labNameText = {
  fontSize: "14px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 16px",
};

const h1 = {
  color: "#E8EAF0",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 24px",
  padding: "0",
};

const text = {
  color: "#E8EAF0",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 24px",
};

const textMuted = {
  color: "#8892A4",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "32px 0 0",
};

const btnContainer = {
  margin: "32px 0",
};

const button = {
  borderRadius: "4px",
  color: "#0C1220",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
  padding: "12px 24px",
};

export default NotificationEmail;
