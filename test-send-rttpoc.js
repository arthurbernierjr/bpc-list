// test-send-rttpoc.js — Send RTTPOC email to TEST_EMAILS for visual QA
// Run: npm run test:rttpoc

import 'dotenv/config';
import { render } from '@react-email/render';
import React from 'react';
import RttpocVideoEmail from './emails/RttpocVideoEmail.jsx';
import { connectDB, sendEmail } from './ses-mongo.js';

const TEST_EMAILS = (process.env.TEST_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
const TEST_NAME = 'Arthur';

if (!TEST_EMAILS.length) {
  console.error('❌ TEST_EMAILS not set in .env');
  process.exit(1);
}

const TEST_EMAIL = TEST_EMAILS[0];
console.log(`\n📧  Test Send RTTPOC — sending to ${TEST_EMAIL}\n`);

await connectDB();

// ─── SEND RTTPOC EMAIL ───────────────────────────────────────────────────
try {
  const rttpocHtml = await render(React.createElement(RttpocVideoEmail, { 
    firstName: TEST_NAME,
    videoTitle: 'Near-Death Experience',
    videoUrl: 'https://www.youtube.com/watch?v=f3HBx3XYMvA',
    videoDescription: 'A personal story I\'ve been meaning to share. Life-changing perspective on what really matters.',
    videoThumbnailUrl: 'https://list-manager.bigpoppacode.io/thumbnail-video-2.png',
  }));
  const rttpocText = await render(React.createElement(RttpocVideoEmail, { 
    firstName: TEST_NAME,
    videoTitle: 'Near-Death Experience',
    videoUrl: 'https://www.youtube.com/watch?v=f3HBx3XYMvA',
    videoDescription: 'A personal story I\'ve been meaning to share. Life-changing perspective on what really matters.',
  }), { plainText: true });

  await sendEmail({
    toEmail: TEST_EMAIL,
    toName: TEST_NAME,
    subject: '[TEST] 🔌 Why Your AI Prompts Are Mid (And How to Fix Them)',
    htmlBody: rttpocHtml,
    textBody: rttpocText,
    listId: 'test-rttpoc',
  });

  console.log('✅  RTTPOC Email sent successfully');
} catch (err) {
  console.error('❌  RTTPOC Email failed:', err.message);
}

console.log('\n📬  Test send complete — check your inbox!\n');

process.exit(0);
