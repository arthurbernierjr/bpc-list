// RttpocVideoEmail.jsx — RTTPOC Framework + YouTube Video Announcement
// Educational content about prompting with new video announcement
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
  Img,
} from '@react-email/components';
import * as React from 'react';

const YOUTUBE_URL = process.env.YOUTUBE_URL || 'https://youtube.com/@bigpoppacode';
const LIBRARY_URL = process.env.LIBRARY_URL || 'https://theaipluglibrary.com/purchase';
const PARTNER_URL = process.env.PARTNER_URL || 'https://theaipluglibrary.com/session';

export default function RttpocVideoEmail({
  firstName = 'Friend',
  videoTitle = 'New Video on the Channel',
  videoUrl = 'https://youtube.com/@bigpoppacode',
  videoDescription = 'Check out my latest video.',
  videoThumbnailUrl = 'https://list-manager.bigpoppacode.io/thumbnail-video-2.png',
}) {
  return (
    <Html>
      <Head />
      <Preview>Why Your AI Prompts Are Mid (And How to Fix Them) — New from Big Poppa Code</Preview>
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
              If you've been in my classes before (which a lot of you keep missing, it's ok though lol), you already heard my prompting strategy.
            </Text>

            <Text style={paragraph}>
              You know how sometimes you ask ChatGPT or Claude for something and it gives you... <strong style={highlight}>trash</strong>? Like technically an answer, but not what you actually needed?
            </Text>

            <Text style={paragraph}>
              That's not the AI being dumb. <strong style={highlight}>That's your prompt being incomplete.</strong>
            </Text>

            <Text style={paragraph}>
              I've been teaching prompt engineering for a minute now, and I keep seeing the same mistake: people throw vague requests at AI and expect mind-reading.
            </Text>

            {/* Mid Prompt Example */}
            <Section style={codeBlock}>
              <Text style={codeLabel}>Example of a mid prompt:</Text>
              <Text style={codeText}>"Write me a LinkedIn post about AI"</Text>
            </Section>

            <Text style={paragraph}>
              What kind of post? How long? What angle? What tone? Who's the audience? See the problem?
            </Text>

            <Hr style={divider} />

            {/* RTTPOC Framework Section */}
            <Section style={frameworkSection}>
              <Text style={frameworkTitle}>🔌 Enter: The RTTPOC Framework</Text>
              <Text style={frameworkIntro}>
                This is a 6-part structure I use for EVERY serious AI prompt. It gives the model exactly what it needs to cook up something actually useful.
              </Text>

              <Text style={frameworkAcronym}>RTTPOC =</Text>
              
              <Section style={frameworkList}>
                <Text style={frameworkItem}><strong style={letterHighlight}>R</strong> — Role: Who the heck is this?</Text>
                <Text style={frameworkItem}><strong style={letterHighlight}>T</strong> — Task: What do you want me to do?</Text>
                <Text style={frameworkItem}><strong style={letterHighlight}>T</strong> — Tone: How do you want me to do it?</Text>
                <Text style={frameworkItem}><strong style={letterHighlight}>P</strong> — Purpose: Why do you need me to do it?</Text>
                <Text style={frameworkItem}><strong style={letterHighlight}>O</strong> — Output: What do you want me to give you?</Text>
                <Text style={frameworkItem}><strong style={letterHighlight}>C</strong> — Constraints: What are the guardrails?</Text>
              </Section>

              <Text style={frameworkNote}>
                Each layer adds precision. Miss one, and you get generic slop. Hit all six, and the AI becomes your secret weapon.
              </Text>
            </Section>

            <Hr style={divider} />

            {/* Good Prompt Example */}
            <Text style={sectionTitle}>Quick Example:</Text>
            <Text style={paragraph}>
              Instead of "Write me a cold email for my newsletter about dogs"...
            </Text>

            <Section style={goodPromptBlock}>
              <Text style={promptLine}><strong style={letterHighlight}>R:</strong> You are a senior marketing strategist with 10 years of B2B SaaS experience</Text>
              <Text style={promptLine}><strong style={letterHighlight}>T:</strong> Write a cold outreach email targeting small business owners</Text>
              <Text style={promptLine}><strong style={letterHighlight}>T:</strong> Professional but warm, like you're offering to help not sell</Text>
              <Text style={promptLine}><strong style={letterHighlight}>P:</strong> Audience is small biz owners who need affordable marketing automation. Goal: book a 15-min discovery call</Text>
              <Text style={promptLine}><strong style={letterHighlight}>O:</strong> Format as: Subject line → Opening (2 sentences) → Value prop (3 sentences) → CTA</Text>
              <Text style={promptLine}><strong style={letterHighlight}>C:</strong> Under 150 words. No jargon. Must mention 14-day free trial. No hard selling</Text>
            </Section>

            <Text style={paragraph}>
              See the difference? That's precision vs. guessing — and that's not even the best prompt. But this structure helps the AI direct you to an answer that's helpful more reliably.
            </Text>

            <Text style={ruleCallout}>
              <strong>The rule:</strong> The more complete your prompt, the more useful your output.
            </Text>

            <Hr style={divider} />

            {/* YouTube Video Section */}
            <Text style={sectionTitle}>🎬 New on the Channel:</Text>
            <Text style={paragraph}>
              I also just dropped a new video you might want to check out:
            </Text>

            <Section style={videoSection}>
              <Link href={videoUrl} style={{ display: 'block', textDecoration: 'none' }}>
                <Img
                  src={videoThumbnailUrl}
                  alt={videoTitle}
                  width="100%"
                  style={videoThumbnail}
                />
              </Link>
              <Text style={videoTitleStyle}>{videoTitle}</Text>
              <Text style={videoDesc}>{videoDescription}</Text>
              <Link href={videoUrl} style={videoCtaButton}>
                WATCH NOW
              </Link>
            </Section>

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
                  Need AI automation, vibe coded applications, or technical strategy? Let's work together.
                </Text>
                <Link href={PARTNER_URL} style={ctaButton}>
                  WORK WITH ME
                </Link>
              </Section>
            </Section>

            <Hr style={divider} />

            <Text style={closing}>
              Save this email. Use the RTTPOC framework. And let me know when your AI starts cooking for you instead of against you.
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
const accent = '#4a90e2';

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

const highlight = {
  color: gold,
};

const letterHighlight = {
  color: accent,
  fontFamily: "'Courier New', Courier, monospace",
};

const sectionTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '16px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  margin: '0 0 16px 0',
};

const divider = {
  borderColor: '#1a1a2e',
  borderTop: '1px solid #1a1a2e',
  margin: '32px 0',
};

// Code Block Styles
const codeBlock = {
  backgroundColor: '#08081a',
  border: '1px solid #2a2a3e',
  borderRadius: '6px',
  margin: '0 0 20px 0',
  padding: '16px 20px',
};

const codeLabel = {
  color: '#888',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '12px',
  margin: '0 0 8px 0',
};

const codeText = {
  color: '#ff6b6b',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '14px',
  margin: 0,
};

// Framework Section Styles
const frameworkSection = {
  backgroundColor: '#08081a',
  border: `2px solid ${accent}`,
  borderRadius: '8px',
  margin: '0 0 24px 0',
  padding: '28px',
};

const frameworkTitle = {
  color: '#ffffff',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 16px 0',
};

const frameworkIntro = {
  color: '#c4c4d4',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0 0 20px 0',
};

const frameworkAcronym = {
  color: gold,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '16px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 16px 0',
};

const frameworkList = {
  margin: '0 0 20px 0',
};

const frameworkItem = {
  color: '#c4c4d4',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0 0 10px 0',
  paddingLeft: '8px',
};

const frameworkNote = {
  color: '#999',
  fontFamily: 'Georgia, serif',
  fontSize: '13px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: 0,
};

// Good Prompt Block Styles
const goodPromptBlock = {
  backgroundColor: '#0a1a0a',
  border: '1px solid #1a3a1a',
  borderLeft: `3px solid ${gold}`,
  borderRadius: '4px',
  margin: '0 0 24px 0',
  padding: '20px',
};

const promptLine = {
  color: '#c4c4d4',
  fontFamily: 'Georgia, serif',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
};

const ruleCallout = {
  backgroundColor: '#1a1a0a',
  border: `1px solid ${gold}`,
  borderRadius: '6px',
  color: '#ffffff',
  fontFamily: 'Georgia, serif',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
  padding: '16px 20px',
  textAlign: 'center',
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

const videoThumbnail = {
  borderRadius: '6px',
  display: 'block',
  marginBottom: '20px',
  width: '100%',
};

const videoTitleStyle = {
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
