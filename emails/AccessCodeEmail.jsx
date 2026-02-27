// AccessCodeEmail.jsx — Transactional fulfillment email for AI Plug Library purchase
// Sent immediately after Square payment is processed

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';

const LIBRARY_URL = process.env.LIBRARY_URL || 'https://theaipluglibrary.com';

export default function AccessCodeEmail({ 
  firstName = 'Friend', 
  accessCode = 'XXXX-XXXX-XXXX',
  sessionPurchase = false,
}) {
  return (
    <Html>
      <Head />
      <Preview>Your access code is inside. Welcome to the library.</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerIcon}>🔑</Text>
            <Text style={headerTitle}>The AI Plug Library</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hey {firstName},</Text>

            <Text style={paragraph}>
              You're in. Here's your access code:
            </Text>

            {/* Access Code Display */}
            <Section style={codeBox}>
              <Text style={codeText}>{accessCode}</Text>
            </Section>

            {/* Instructions */}
            <Section style={instructionsSection}>
              <Text style={instructionsTitle}>How to access your library</Text>
              
              <table style={instructionsTable}>
                <tbody>
                  <tr>
                    <td style={stepNumber}>1</td>
                    <td style={stepText}>Go to <Link href={LIBRARY_URL} style={inlineLink}>theaipluglibrary.com</Link></td>
                  </tr>
                  <tr>
                    <td style={stepNumber}>2</td>
                    <td style={stepText}>Enter your name and email address</td>
                  </tr>
                  <tr>
                    <td style={stepNumber}>3</td>
                    <td style={stepText}>Enter your access code in the Access Code field</td>
                  </tr>
                  <tr>
                    <td style={stepNumber}>4</td>
                    <td style={stepText}>Click "Get Instant Access"</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Important Note */}
            <Section style={noteBox}>
              <Text style={noteText}>
                <strong>Important:</strong> Your access code is unique to you. Do not share it. Each code can only be used once.
              </Text>
            </Section>

            {/* What's Included */}
            <Section style={whatYouGetSection}>
              <Text style={whatYouGetTitle}>Here's what's waiting for you:</Text>
              <Text style={whatYouGetText}>
                4 in-depth courses covering Prompt Engineering, AI Content Creation, N8N Automation, and Vibe Coding. Over 3,000 N8N workflows ready to deploy. Over 3,000 ChatGPT prompts for content, marketing, and strategy. 2 profitable playbooks including the complete Vibe Coding Playbook. New Vibe Coding Frameworks and Claude Skills added exclusively for this release.
              </Text>
            </Section>

            {/* Session Purchase Note (conditional) */}
            {sessionPurchase && (
              <Section style={sessionNote}>
                <Text style={sessionNoteText}>
                  You also purchased a 1-on-1 session. Arthur will reach out within 24 hours to schedule your sessions.
                </Text>
              </Section>
            )}

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Link href={LIBRARY_URL} style={ctaButton}>
                Access The Library →
              </Link>
            </Section>

            {/* Closing */}
            <Text style={closing}>
              Welcome to the library. Let's build.
            </Text>

            <Text style={signature}>
              Arthur / Big Poppa Code 👾
            </Text>

            {/* Transactional Footer */}
            <Section style={transactionalFooter}>
              <Text style={transactionalText}>
                This is a transactional email confirming your purchase. You cannot unsubscribe from purchase confirmations.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── COLORS ─────────────────────────────────────────────────────────────────
const gold = '#FFD700';
const darkBg = '#080808';
const containerBg = '#111111';
const muted = '#888888';

// ─── STYLES ─────────────────────────────────────────────────────────────────
const body = {
  backgroundColor: darkBg,
  fontFamily: 'Georgia, serif',
  margin: 0,
  padding: '40px 0',
};

const container = {
  backgroundColor: containerBg,
  border: '1px solid #222222',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '580px',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#0a0a0a',
  borderBottom: `2px solid ${gold}`,
  padding: '32px',
  textAlign: 'center',
};

const headerIcon = {
  fontSize: '48px',
  margin: '0 0 12px 0',
};

const headerTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '22px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: 0,
};

const content = {
  padding: '32px',
};

const greeting = {
  color: '#ffffff',
  fontFamily: 'Georgia, serif',
  fontSize: '20px',
  margin: '0 0 24px 0',
};

const paragraph = {
  color: '#d4d4d4',
  fontFamily: 'Georgia, serif',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 24px 0',
};

const codeBox = {
  backgroundColor: '#0a0a0a',
  border: `2px solid ${gold}`,
  borderRadius: '8px',
  margin: '0 0 32px 0',
  padding: '24px',
  textAlign: 'center',
};

const codeText = {
  color: gold,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '28px',
  fontWeight: '700',
  letterSpacing: '3px',
  margin: 0,
};

const instructionsSection = {
  backgroundColor: '#0d0d0d',
  border: '1px solid #1e1e1e',
  borderRadius: '6px',
  margin: '0 0 24px 0',
  padding: '24px',
};

const instructionsTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '14px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0 0 20px 0',
};

const instructionsTable = {
  width: '100%',
};

const stepNumber = {
  color: gold,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '16px',
  fontWeight: '700',
  paddingRight: '16px',
  paddingBottom: '12px',
  verticalAlign: 'top',
  width: '24px',
};

const stepText = {
  color: '#d4d4d4',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.6',
  paddingBottom: '12px',
  verticalAlign: 'top',
};

const inlineLink = {
  color: gold,
  textDecoration: 'underline',
};

const noteBox = {
  backgroundColor: 'rgba(255, 215, 0, 0.05)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  borderRadius: '6px',
  margin: '0 0 28px 0',
  padding: '16px 20px',
};

const noteText = {
  color: '#b4b4b4',
  fontFamily: 'Georgia, serif',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: 0,
};

const whatYouGetSection = {
  margin: '0 0 28px 0',
};

const whatYouGetTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '14px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0 0 12px 0',
};

const whatYouGetText = {
  color: '#a4a4a4',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: 0,
};

const sessionNote = {
  backgroundColor: 'rgba(255, 215, 0, 0.08)',
  borderLeft: `3px solid ${gold}`,
  borderRadius: '0 6px 6px 0',
  margin: '0 0 28px 0',
  padding: '16px 20px',
};

const sessionNoteText = {
  color: '#d4d4d4',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: 0,
};

const ctaSection = {
  margin: '32px 0',
  textAlign: 'center',
};

const ctaButton = {
  backgroundColor: gold,
  borderRadius: '4px',
  color: '#000000',
  display: 'inline-block',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '14px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  padding: '16px 32px',
  textDecoration: 'none',
};

const closing = {
  color: '#d4d4d4',
  fontFamily: 'Georgia, serif',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '28px 0 0 0',
};

const signature = {
  color: '#ffffff',
  fontFamily: 'Georgia, serif',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '16px 0 0 0',
};

const transactionalFooter = {
  borderTop: '1px solid #222222',
  marginTop: '32px',
  paddingTop: '20px',
};

const transactionalText = {
  color: '#555555',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '10px',
  lineHeight: '1.5',
  margin: 0,
  textAlign: 'center',
};
