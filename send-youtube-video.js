// send-youtube-video.js — Send YouTube video announcement to Main Leads list
// Run: npm run send:youtube-video
// CUSTOMIZE: Update videoTitle, videoUrl, videoDescription, and subject before sending

import { render } from '@react-email/render';
import React from 'react';
import YouTubeVideoEmail from './emails/YouTubeVideoEmail.jsx';
import { sendCampaign } from './ses-mongo.js';

// ──────────────────────────────────────────────────────────────────────────
// ✏️  CUSTOMIZE THESE VALUES FOR EACH VIDEO
// ──────────────────────────────────────────────────────────────────────────

const VIDEO_TITLE = 'This Gold Rush Won\'t Wait for You to Learn Everything';
const VIDEO_URL = 'https://youtu.be/TTbKwGMt_z4';
const VIDEO_DESCRIPTION = 'The AI opportunity window is closing faster than you think. Learn why perfect preparation is the enemy of progress and what to do instead.';
const EMAIL_SUBJECT = '⚡ This Gold Rush Won\'t Wait for You to Learn Everything';

// ──────────────────────────────────────────────────────────────────────────

await sendCampaign({
  listName:     'Main Leads',           // Must match list name in dashboard exactly
  campaignName: `YouTube Video: ${VIDEO_TITLE}`,
  subject:      EMAIL_SUBJECT,

  async buildEmail({ firstName, contact }) {
    // You can use contact.meta for additional personalization
    // e.g., contact.meta.source, contact.meta['first name'], etc.
    const name = firstName !== 'Friend' ? firstName : (contact?.meta?.['first name'] || 'Friend');
    
    return {
      html: await render(React.createElement(YouTubeVideoEmail, { 
        firstName: name,
        videoTitle: VIDEO_TITLE,
        videoUrl: VIDEO_URL,
        videoDescription: VIDEO_DESCRIPTION,
      })),
      text: await render(React.createElement(YouTubeVideoEmail, { 
        firstName: name,
        videoTitle: VIDEO_TITLE,
        videoUrl: VIDEO_URL,
        videoDescription: VIDEO_DESCRIPTION,
      }), { plainText: true }),
    };
  },
});
