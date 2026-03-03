// CommunityEmail.jsx — AI Plug Library Campaign for 40K Community List
// Sent to Digital Boss Code Community
// Subject: Love, Cancer, and AI Automation

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';

const LIBRARY_URL = process.env.LIBRARY_URL || 'https://theaipluglibrary.com/purchase';
const SESSION_URL = process.env.SESSION_URL || 'https://theaipluglibrary.com/session';

export default function CommunityEmail({ firstName = 'Friend' }) {
  return (
    <Html>
      <Head />
      <Preview>A story I haven't told publicly. And something I built because of it.</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>Big Poppa Code 👾</Text>
            <Text style={headerSub}>The AI Plug Lab Community</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hey {firstName},</Text>

            <Text style={paragraph}>
              I want to tell you a story I haven't told many people.
            </Text>

            <Text style={paragraph}>
              About a year ago I thought my marriage was over.
            </Text>

            <Text style={paragraph}>
              My wife's behavior had changed. Volatile. Erratic. Sometimes physically and verbally aggressive in ways that blindsided me. I didn't understand it. I started making plans for a life without her.
            </Text>

            <Text style={paragraph}>
              Then we found out she had stage 4 brain cancer.
            </Text>
            <Text style={paragraph}>
             And it had been eating away at her for years and we didn't know it.
            </Text>

            <Text style={paragraph}>
              Everything I had interpreted as our relationship falling apart was a symptom. The 8 tumors had been changing her. The woman I had been pulling away from was fighting something she didn't even know was inside her.
            </Text>

            <Text style={paragraph}>
              We went from estranged partners to in sickness and in health overnight.
            </Text>

            <Text style={paragraph}>
              And my life, my schedule, my income, my responsibilities, all of it had to keep moving. She needed me present. Bills needed to get paid. My community needed me to show up.
            </Text>

            <Text style={paragraph}>
              I'm a software engineer. I know how to build systems. And for the first time in my life I understood in my bones why that skill matters, not just professionally, but personally.
            </Text>

            <Text style={paragraph}>
              I automated everything I could. I used AI to do in one hour what used to take me a day. I vibecoded tools that held my business together while I was in waiting rooms learning medical terminology I never wanted to know.
            </Text>

            <Text style={paragraph}>
              I didn't talk about this publicly because I was living it. But I'm talking about it now because I built something out of that season that I think can help you.
            </Text>

            <Hr style={divider} />

            {/* Library Offer */}
            <Section style={librarySection}>
              <Text style={libraryTitle}>The AI Plug Library</Text>
              <Text style={libraryText}>
                Everything I used to keep my life and business running during the hardest stretch of my life.
              </Text>
              <Text style={libraryText}>
                Vibe Coding Frameworks. Claude Skills. AI automation systems. Prompt libraries. Organized, documented, and ready for you to deploy.
              </Text>
              <Text style={libraryText}>
                I just updated it with new Vibe Coding Frameworks and Claude Skills that aren't available anywhere else.
              </Text>
              <Text style={priceText}>$197. One time. No subscription. Launch price ends March 9th.</Text>
              <Link href={LIBRARY_URL} style={libraryCtaButton}>
                GET ACCESS
              </Link>
            </Section>

            <Text style={paragraph}>
              If you want to go deeper, I do limited 1-on-1 sessions.
            </Text>

            {/* Session Offer */}
            <Section style={sessionSection}>
              <Text style={sessionText}>
                Two 2-hour sessions for $1,000. Just you and me. I'll show you how to vibecode and deploy real applications to the cloud. You leave with something built and shipped, not just notes.
              </Text>
              <Link href={SESSION_URL} style={sessionCtaButton}>
                BOOK A SESSION
              </Link>
            </Section>

            <Text style={closing}>
              If any part of what I described resonates, the chaos, the pressure, the need to keep moving when you're barely standing, then this is for you.
            </Text>

            <Text style={signature}>
              Arthur<br />
              <span style={signatureMuted}>Big Poppa Code</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── COLORS ─────────────────────────────────────────────────────────────────
const silver = '#C0C0C0';
const gold = '#FFD700';
const navyBg = '#060610';
const containerBg = '#0d0d1a';
const muted = '#666666';

// ─── STYLES ─────────────────────────────────────────────────────────────────
const body = {
  backgroundColor: navyBg,
  fontFamily: 'Georgia, serif',
  margin: 0,
  padding: '40px 0',
};

const container = {
  backgroundColor: containerBg,
  border: '1px solid #1a1a2e',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '580px',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#08081a',
  borderBottom: `2px solid ${silver}`,
  padding: '28px 32px',
  textAlign: 'center',
};

const logoText = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '24px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0 0 4px 0',
};

const headerSub = {
  color: silver,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '11px',
  letterSpacing: '3px',
  margin: 0,
  textTransform: 'uppercase',
};

const content = {
  padding: '36px 32px',
};

const greeting = {
  color: '#ffffff',
  fontFamily: 'Georgia, serif',
  fontSize: '20px',
  margin: '0 0 24px 0',
};

const paragraph = {
  color: '#c4c4d4',
  fontFamily: 'Georgia, serif',
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '0 0 18px 0',
};

const divider = {
  borderColor: '#1a1a2e',
  borderTop: '1px solid #1a1a2e',
  margin: '32px 0',
};

const librarySection = {
  backgroundColor: '#08081a',
  border: `1px solid ${silver}`,
  borderRadius: '8px',
  margin: '0 0 28px 0',
  padding: '28px',
  textAlign: 'center',
};

const libraryTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '20px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0 0 20px 0',
};

const libraryText = {
  color: '#a4a4b4',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0 0 14px 0',
};

const priceText = {
  color: gold,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '16px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '20px 0 24px 0',
};

const libraryCtaButton = {
  backgroundColor: silver,
  borderRadius: '4px',
  color: '#000000',
  display: 'inline-block',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '16px 32px',
  textDecoration: 'none',
};

const sessionSection = {
  backgroundColor: '#0a0a1a',
  border: '1px solid #1a1a2e',
  borderRadius: '8px',
  margin: '0 0 28px 0',
  padding: '24px',
  textAlign: 'center',
};

const sessionText = {
  color: '#999999',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0 0 20px 0',
};

const sessionCtaButton = {
  backgroundColor: 'transparent',
  border: '1px solid #333344',
  borderRadius: '4px',
  color: '#888888',
  display: 'inline-block',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '12px 24px',
  textDecoration: 'none',
};

const closing = {
  color: '#c4c4d4',
  fontFamily: 'Georgia, serif',
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '28px 0 0 0',
};

const signature = {
  color: '#ffffff',
  fontFamily: 'Georgia, serif',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '20px 0 0 0',
};

const signatureMuted = {
  color: muted,
};
