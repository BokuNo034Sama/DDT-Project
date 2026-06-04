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

interface InvitationEmailProps {
  labName: string;
  inviterName?: string;
  role: string;
  token: string;
  appUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const InvitationEmail = ({
  labName,
  inviterName,
  role,
  token,
  appUrl = baseUrl,
}: InvitationEmailProps) => {
  const inviteLink = `${appUrl}/accept-invite?token=${token}`;
  
  const displayRole = role === 'ops_manager' ? 'Operations Manager' : 'Staff Member';
  const previewText = `Join ${labName} on DDT Structure`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>DDT Structure</Heading>
          
          <Text style={text}>Hello,</Text>
          <Text style={text}>
            {inviterName ? `${inviterName} has` : 'You have been'} invited you to join <strong>{labName}</strong> on DDT Structure as a <strong>{displayRole}</strong>.
          </Text>
          
          <Section style={btnContainer}>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
          </Section>
          
          <Text style={textMuted}>
            This invitation link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.
          </Text>
          
        </Container>
      </Body>
    </Html>
  );
};

// Styles matching DDT Structure's dark, industrial aesthetic
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

const h1 = {
  color: "#3B82F6",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 24px",
  padding: "0",
};

const text = {
  color: "#E8EAF0",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const textMuted = {
  color: "#8892A4",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "32px 0 0",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#A3E635",
  borderRadius: "4px",
  color: "#0C1220",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "14px",
};

export default InvitationEmail;
