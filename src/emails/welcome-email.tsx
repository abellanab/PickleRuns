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

export interface WelcomeEmailProps {
  displayName: string;
}

export function WelcomeEmail({ displayName }: WelcomeEmailProps) {
  const name = displayName?.trim() ? displayName : "baller";
  return (
    <Html>
      <Head />
      <Preview>Welcome to PickleRuns — let&apos;s get you on the court.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>PICKLERUNS</Text>
            <div style={accentBar} />
          </Section>

          <Heading style={heading}>
            Welcome, <span style={accentText}>{name}</span>.
          </Heading>

          <Text style={text}>
            Your account is live. PickleRuns keeps your pickleball runs organized — run
            the queue, track the score, and keep the court moving.
          </Text>
          <Text style={text}>
            Create a run, share the code, and let players join from their phones.
          </Text>

          <div style={divider} />
          <Text style={signoff}>See you on the court.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

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
