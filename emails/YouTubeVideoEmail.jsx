// YouTubeVideoEmail.jsx — YouTube Video Announcement Email
// Sent to Main Leads list when new videos drop
// Subject: Dynamic - set in send script

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

const YOUTUBE_URL = process.env.YOUTUBE_URL || 'https://youtube.com/@bigpoppacode';
const LIBRARY_URL = process.env.LIBRARY_URL || 'https://theaipluglibrary.com/purchase';
const PARTNER_URL = process.env.PARTNER_URL || 'https://theaipluglibrary.com/session';

export default function YouTubeVideoEmail({ 
  firstName = 'Friend',
  videoTitle = 'New Video on the Channel',
  videoUrl = 'https://youtube.com/@bigpoppacode',
  videoDescription = 'Check out my latest video on AI, automation, and building with code.',
}) {
  return (
    <Html>
      <Head />
      <Preview>{videoTitle} — New from Big Poppa Code</Preview>
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
              Just dropped a new video:
            </Text>

            {/* Video Highlight Box */}
            <Section style={videoSection}>
              <Text style={videoTitle}>{videoTitle}</Text>
              <Text style={videoDesc}>{videoDescription}</Text>
              <Link href={videoUrl} style={videoCtaButton}>
                WATCH NOW
              </Link>
            </Section>

            <Text style={paragraph}>
              If you've been getting value from the channel, hit that subscribe button and join the community. We're building something real here.
            </Text>

            <Hr style={divider} />

            {/* Quick CTAs Section */}
            <Section style={ctaSection}>
              <Text style={ctaSectionTitle}>Ways to Go Deeper:</Text>

              {/* Subscribe CTA */}
              <Section style={ctaBlock}>
                <Text style={ctaTitle}>📺 Subscribe on YouTube</Text>
                <Text style={ctaText}>
                  New videos on AI, automation, vibe coding, and real-world tech. Free, always.
                </Text>
                <Link href={YOUTUBE_URL} style={ctaButton}>
                  SUBSCRIBE
                </Link>
              </Section>

              {/* Library CTA */}
              <Section style={ctaBlock}>
                <Text style={ctaTitle}>🔌 Get The AI Plug Library</Text>
                <Text style={ctaText}>
                  Vibe Coding Frameworks, Claude Skills, automation systems, prompt libraries. Everything I use. $197 one-time. No subscription.
                </Text>
                <Link href={LIBRARY_URL} style={ctaButton}>
                  GET ACCESS
                </Link>
              </Section>

              {/* Partner/Contract CTA */}
              <Section style={ctaBlock}>
                <Text style={ctaTitle}>🤝 Partner or Contract AI Plug Labs</Text>
                <Text style={ctaText}>
                  Need AI automation, vibe coded applications, or technical strategy? Let's work together. Book a session or reach out about partnership opportunities.
                </Text>
                <Link href={PARTNER_URL} style={ctaButton}>
                  WORK WITH ME
                </Link>
              </Section>
            </Section>

            <Hr style={divider} />

            <Text style={closing}>
              Thanks for being part of this. More value coming soon.
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
const accent = '#4a90e2'; // YouTube blue accent

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

// Video Section Styles
const videoSection = {
  backgroundColor: '#08081a',
  border: `2px solid ${accent}`,
  borderRadius: '8px',
  margin: '0 0 28px 0',
  padding: '28px',
  textAlign: 'center',
};

const videoTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '18px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  lineHeight: '1.4',
  margin: '0 0 16px 0',
};

const videoDesc = {
  color: '#a4a4b4',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0 0 24px 0',
};

const videoCtaButton = {
  backgroundColor: accent,
  borderRadius: '4px',
  color: '#ffffff',
  display: 'inline-block',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '16px 32px',
  textDecoration: 'none',
};

// CTA Section Styles
const ctaSection = {
  margin: '0 0 20px 0',
};

const ctaSectionTitle = {
  color: silver,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '14px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0 0 24px 0',
  textTransform: 'uppercase',
};

const ctaBlock = {
  backgroundColor: '#0a0a1a',
  border: '1px solid #1a1a2e',
  borderRadius: '8px',
  margin: '0 0 20px 0',
  padding: '24px',
  textAlign: 'center',
};

const ctaTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 12px 0',
};

const ctaText = {
  color: '#999999',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const ctaButton = {
  backgroundColor: 'transparent',
  border: `1px solid ${silver}`,
  borderRadius: '4px',
  color: silver,
  display: 'inline-block',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '12px 24px',
  textDecoration: 'none',
  transition: 'all 0.3s ease',
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
