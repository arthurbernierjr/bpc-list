// test-send.js — Send both email templates to TEST_EMAIL for visual QA
// Run: node test-send.js

import 'dotenv/config';
import { render } from '@react-email/render';
import React from 'react';
import ConferenceEmail from './emails/ConferenceEmail.jsx';
import CommunityEmail from './emails/CommunityEmail.jsx';
import YouTubeVideoEmail from './emails/YouTubeVideoEmail.jsx';
import { connectDB, sendEmail } from './ses-mongo.js';

const TEST_EMAILS = (process.env.TEST_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
const TEST_NAME = 'Arthur';

if (!TEST_EMAILS.length) {
  console.error('❌ TEST_EMAILS not set in .env');
  process.exit(1);
}

const TEST_EMAIL = TEST_EMAILS[0]; // Use first email for test
console.log(`\n📧  Test Send — sending to ${TEST_EMAIL}\n`);

await connectDB();

// // ─── SEND CONFERENCE EMAIL ──────────────────────────────────────────────────
// try {
//   const conferenceHtml = await render(React.createElement(ConferenceEmail, { firstName: TEST_NAME }));
//   const conferenceText = await render(React.createElement(ConferenceEmail, { firstName: TEST_NAME }), { plainText: true });

//   await sendEmail({
//     toEmail: TEST_EMAIL,
//     toName: TEST_NAME,
//     subject: '[TEST] It was great meeting you at New Year New You 🎯',
//     htmlBody: conferenceHtml,
//     textBody: conferenceText,
//     listId: 'test-conference',
//   });

//   console.log('✅  Conference Email sent successfully');
// } catch (err) {
//   console.error('❌  Conference Email failed:', err.message);
// }

// // ─── SEND COMMUNITY EMAIL ───────────────────────────────────────────────────
// try {
//   const communityHtml = await render(React.createElement(CommunityEmail, { firstName: TEST_NAME }));
//   const communityText = await render(React.createElement(CommunityEmail, { firstName: TEST_NAME }), { plainText: true });

//   await sendEmail({
//     toEmail: TEST_EMAIL,
//     toName: TEST_NAME,
//     subject: '[TEST] The Silver Play Button just hit — and Season 2 is coming 🥈🎙️',
//     htmlBody: communityHtml,
//     textBody: communityText,
//     listId: 'test-community',
//   });

//   console.log('✅  Community Email sent successfully');
// } catch (err) {
//   console.error('❌  Community Email failed:', err.message);
// }

// ─── SEND YOUTUBE VIDEO EMAIL ───────────────────────────────────────────────────
try {
  const youtubeVideoHtml = await render(React.createElement(YouTubeVideoEmail, { firstName: TEST_NAME, videoTitle: 'This Gold Rush Won\'t Wait for You to Learn Everything', videoUrl: 'https://youtu.be/TTbKwGMt_z4', videoDescription: 'The AI opportunity window is closing faster than you think. Learn why perfect preparation is the enemy of progress and what to do instead.' }));
  const youtubeVideoText = await render(React.createElement(YouTubeVideoEmail, { firstName: TEST_NAME, videoTitle: 'This Gold Rush Won\'t Wait for You to Learn Everything', videoUrl: 'https://youtu.be/TTbKwGMt_z4', videoDescription: 'The AI opportunity window is closing faster than you think. Learn why perfect preparation is the enemy of progress and what to do instead.' }), { plainText: true });

  await sendEmail({
    toEmail: TEST_EMAIL,
    toName: TEST_NAME,
    subject: '[TEST] 🎥 New Video: This Gold Rush Won\'t Wait for You to Learn Everything',
    htmlBody: youtubeVideoHtml,
    textBody: youtubeVideoText,
    listId: 'test-youtube-video',
  });

  console.log('✅  YouTube Video Email sent successfully');
} catch (err) {
  console.error('❌  YouTube Video Email failed:', err.message);
}

console.log('\n📬  Test send complete — check your inbox!\n');

// Don't disconnect - let the process exit naturally
process.exit(0);



