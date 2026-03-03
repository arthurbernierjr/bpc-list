// ConferenceEmail.jsx — AI Plug Library Campaign for Conference Attendees
// Sent to 800 New Year New You conference attendees
// Subject: You showed up. So here's everything I've got.

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

const BOOK_URL = 'https://bigpoppacode.io/go/2032/qwertyuiopxz';
const LIBRARY_URL = process.env.LIBRARY_URL || 'https://theaipluglibrary.com/purchase';
const SESSION_URL = process.env.SESSION_URL || 'https://theaipluglibrary.com/session';

export default function ConferenceEmail({ firstName = 'Friend' }) {
  return (
    <Html>
      <Head />
      <Preview>Your free book is inside. Plus something personal I want to share.</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>Big Poppa Code 👾</Text>
            <Text style={headerSub}>New Year New You Conference</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hey {firstName},</Text>

            <Text style={paragraph}>
              You were in that room at New Year New You and I want you to know that meant something to me.
            </Text>

            <Text style={paragraph}>
              So before anything else, here's your free copy of The 2032 Survival Guide:
            </Text>

            {/* Book CTA */}
            <Section style={bookCtaSection}>
              <Link href={BOOK_URL} style={bookCtaButton}>
                DOWNLOAD YOUR FREE BOOK
              </Link>
            </Section>

            <Text style={paragraph}>
              That's yours. No strings.
            </Text>

            <Text style={paragraph}>
              Now I want to tell you something I haven't said publicly very much.
            </Text>

            {/* Section Heading */}
            <Text style={sectionHeading}>Love, Cancer, and AI Automation</Text>

            <Text style={paragraph}>
              About a year ago I thought my marriage was over.
            </Text>

            <Text style={paragraph}>
              My wife and I were in a bad place. Her behavior had changed. Volatile, dangerous, and erratic, things that didn't make sense for the woman I married. I won't pretend I handled it perfectly. I made plans. I started thinking about what life looked like on the other side of a divorce, with custody of our kids.
            </Text>
            <Text style={paragraph}>
             I was scared. I have unresolved trauma from when I was a teenager and my cousin was murdered by her husband when he was having a mental health crisis.
            </Text>

            <Text style={paragraph}>
              Then we got the diagnosis.
            </Text>

            <Text style={paragraph}>
              Stage 4 brain cancer.
            </Text>

            <Text style={paragraph}>
              Everything that had been happening, the mood swings, the verbal and physical outbursts, the person I didn't recognize anymore, it was the 8 tumors eating away at her brain. It wasn't her. It was never her.
            </Text>

            <Text style={paragraph}>
              In one moment we went from estranged partners to in sickness and in health, for real this time.
            </Text>

            <Text style={paragraph}>
              My entire life had to reorganize overnight. How I worked. How I managed money. How I showed up for her and for everything else I was responsible for. I couldn't drop the ball on any of it because too many people were counting on me.
            </Text>

            <Text style={paragraph}>
              The only reason I survived that period without completely falling apart professionally is AI and automation.
            </Text>

            <Text style={paragraph}>
              Not as a gimmick. Not as a trend. As infrastructure. As the thing that kept the machine running while I was sitting in hospital waiting rooms and learning what a glioma was.
            </Text>

            <Text style={paragraph}>
              I automated my content pipeline. I automated my client communications. I vibecoded tools in hours that would have taken weeks. I built systems that worked while I couldn't.
            </Text>

            <Text style={paragraph}>
              That's what I want to give you access to.
            </Text>

            <Hr style={divider} />

            {/* Library Offer */}
            <Section style={offerSection}>
              <Text style={offerTitle}>The AI Plug Library, $197</Text>
              <Text style={offerText}>
                Everything I use. The frameworks, the prompts, the Claude Skills, the Vibe Coding systems, all of it organized and ready to deploy. I just added new Vibe Coding Frameworks and Claude Skills that aren't anywhere else.
              </Text>
              <Link href={LIBRARY_URL} style={libraryCtaButton}>
                GET ACCESS FOR $197
              </Link>
            </Section>

            <Text style={paragraph}>
              And if you want me in the room with you:
            </Text>

            {/* Session Offer */}
            <Section style={sessionSection}>
              <Text style={sessionTitle}>1-on-1 Sessions, $1,000</Text>
              <Text style={sessionText}>
                Two 2-hour sessions. Just us. I'll show you how to vibecode and deploy real applications to the cloud. You'll leave with something built and shipped.
              </Text>
              <Link href={SESSION_URL} style={sessionCtaButton}>
                BOOK A SESSION
              </Link>
            </Section>

            <Text style={closing}>
              You were in that room for a reason. Let's keep building.
            </Text>

            <Text style={signature}>
              Arthur<br />
              <span style={signatureGold}>Big Poppa Code</span>
            </Text>
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
  color: gold,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '11px',
  letterSpacing: '3px',
  margin: 0,
  textTransform: 'uppercase',
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
  lineHeight: '1.8',
  margin: '0 0 18px 0',
};

const bookCtaSection = {
  margin: '28px 0',
  textAlign: 'center',
};

const bookCtaButton = {
  backgroundColor: gold,
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

const sectionHeading = {
  color: gold,
  fontFamily: 'Georgia, "DM Serif Display", serif',
  fontSize: '22px',
  fontStyle: 'italic',
  lineHeight: '1.4',
  margin: '32px 0 24px 0',
  textAlign: 'center',
};

const divider = {
  borderColor: '#222222',
  borderTop: '1px solid #222222',
  margin: '32px 0',
};

const offerSection = {
  backgroundColor: '#0a0a0a',
  border: `1px solid ${gold}`,
  borderRadius: '8px',
  margin: '0 0 28px 0',
  padding: '28px',
  textAlign: 'center',
};

const offerTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '18px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0 0 16px 0',
};

const offerText = {
  color: '#b4b4b4',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0 0 24px 0',
};

const libraryCtaButton = {
  backgroundColor: 'transparent',
  border: `2px solid ${gold}`,
  borderRadius: '4px',
  color: gold,
  display: 'inline-block',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '14px 28px',
  textDecoration: 'none',
};

const sessionSection = {
  backgroundColor: '#0d0d0d',
  border: '1px solid #1e1e1e',
  borderRadius: '8px',
  margin: '0 0 28px 0',
  padding: '24px',
  textAlign: 'center',
};

const sessionTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '14px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0 0 12px 0',
};

const sessionText = {
  color: '#999999',
  fontFamily: 'Georgia, serif',
  fontSize: '13px',
  lineHeight: '1.7',
  margin: '0 0 20px 0',
};

const sessionCtaButton = {
  backgroundColor: 'transparent',
  border: '1px solid #444444',
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
  margin: '20px 0 0 0',
};

const signatureGold = {
  color: gold,
};
