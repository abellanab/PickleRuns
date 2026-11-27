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

export interface HostRequestAdminEmailProps {
  displayName: string;
  email: string | null;
  approveUrl: string;
  denyUrl: string;
}

export function HostRequestAdminEmail({
  displayName,
  email,
  approveUrl,
  denyUrl,
}: HostRequestAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{displayName} wants to host on PickleRuns.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>PICKLERUNS</Text>
            <div style={accentBar} />
          </Section>

          <Heading style={heading}>
            New host <span style={accentText}>request</span>
          </Heading>

          <Text style={text}>
            <strong style={strong}>{displayName}</strong>
            {email ? ` (${email})` : ""} asked to become a host.
          </Text>
          <Text style={text}>
            Each button opens a confirmation page. Nothing is decided until you confirm there.
          </Text>

          <Section style={buttons}>
            <Button href={approveUrl} style={button}>
              Approve
            </Button>
            <Button href={denyUrl} style={buttonDeny}>
              Deny
            </Button>
          </Section>

          <div style={divider} />
          <Text style={signoff}>Links expire in 7 days.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default HostRequestAdminEmail;

const body = {
  backgroundColor: "#0e0f0c",
  margin: "0",
  padding: "24px 0",
  fontFamily: "Barlow, Arial, Helvetica, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "32px",
  maxWidth: "480px",
  backgroundColor: "#161710",
  border: "1px solid #2a2c22",
  borderRadius: "16px",
};

const header = {
  marginBottom: "24px",
};

const wordmark = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontSize: "30px",
  fontWeight: 800,
  letterSpacing: "0.5px",
  textTransform: "uppercase" as const,
  color: "#f0f0e8",
  margin: "0",
  lineHeight: "1",
};

const accentBar = {
  width: "48px",
  height: "3px",
  backgroundColor: "#c8f135",
  borderRadius: "2px",
  marginTop: "10px",
};

const heading = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontSize: "24px",
  fontWeight: 800,
  textTransform: "uppercase" as const,
  letterSpacing: "0.3px",
  color: "#f0f0e8",
  margin: "0 0 16px",
};

const accentText = {
  color: "#c8f135",
};

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#8a8c7a",
  margin: "0 0 14px",
};

const strong = {
  color: "#f0f0e8",
};

const buttons = {
  margin: "20px 0 0",
};

const button = {
  backgroundColor: "#c8f135",
  color: "#0e0f0c",
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontSize: "16px",
  fontWeight: 800,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  textDecoration: "none",
  display: "inline-block",
  padding: "14px 24px",
  borderRadius: "10px",
  marginRight: "10px",
};

const buttonDeny = {
  ...button,
  backgroundColor: "transparent",
  color: "#f0f0e8",
  border: "1px solid #4a4c3e",
  marginRight: "0",
};

const divider = {
  borderTop: "1px solid #2a2c22",
  margin: "24px 0",
};

const signoff = {
  fontFamily: "'Barlow Condensed', Arial, sans-serif",
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "1.5px",
  color: "#4a4c3e",
  margin: "0",
};
