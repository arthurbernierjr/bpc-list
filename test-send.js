// test-send.js — Send both email templates to TEST_EMAIL for visual QA
// Run: node test-send.js

import 'dotenv/config';
import { render } from '@react-email/render';
import React from 'react';
import ConferenceEmail from './emails/ConferenceEmail.jsx';
import CommunityEmail from './emails/CommunityEmail.jsx';
import { connectDB, sendEmail } from './ses-mongo.js';

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_NAME = 'Arthur';

if (!TEST_EMAIL) {
  console.error('❌ TEST_EMAIL not set in .env');
  process.exit(1);
}

console.log(`\n📧  Test Send — sending to ${TEST_EMAIL}\n`);

await connectDB();

// ─── SEND CONFERENCE EMAIL ──────────────────────────────────────────────────
try {
  const conferenceHtml = await render(React.createElement(ConferenceEmail, { firstName: TEST_NAME }));
  const conferenceText = await render(React.createElement(ConferenceEmail, { firstName: TEST_NAME }), { plainText: true });

  await sendEmail({
    toEmail: TEST_EMAIL,
    toName: TEST_NAME,
    subject: '[TEST] It was great meeting you at New Year New You 🎯',
    htmlBody: conferenceHtml,
    textBody: conferenceText,
    listId: 'test-conference',
  });

  console.log('✅  Conference Email sent successfully');
} catch (err) {
  console.error('❌  Conference Email failed:', err.message);
}

// ─── SEND COMMUNITY EMAIL ───────────────────────────────────────────────────
try {
  const communityHtml = await render(React.createElement(CommunityEmail, { firstName: TEST_NAME }));
  const communityText = await render(React.createElement(CommunityEmail, { firstName: TEST_NAME }), { plainText: true });

  await sendEmail({
    toEmail: TEST_EMAIL,
    toName: TEST_NAME,
    subject: '[TEST] The Silver Play Button just hit — and Season 2 is coming 🥈🎙️',
    htmlBody: communityHtml,
    textBody: communityText,
    listId: 'test-community',
  });

  console.log('✅  Community Email sent successfully');
} catch (err) {
  console.error('❌  Community Email failed:', err.message);
}

console.log('\n📬  Test send complete — check your inbox!\n');

// Don't disconnect - let the process exit naturally
process.exit(0);



