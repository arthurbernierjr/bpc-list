// send-rttpoc-video.js — RTTPOC Framework + New YouTube Video Email
// Run: npm run send:rttpoc-video
// Sends educational content about prompting + announces new video

import { render } from '@react-email/render';
import React from 'react';
import RttpocVideoEmail from './emails/RttpocVideoEmail.jsx';
import { sendCampaign } from './ses-mongo.js';

// ──────────────────────────────────────────────────────────────────────────
// ✏️  VIDEO DETAILS
// ──────────────────────────────────────────────────────────────────────────

const VIDEO_TITLE = 'Near-Death Experience';
const VIDEO_URL = 'https://www.youtube.com/watch?v=f3HBx3XYMvA';
const VIDEO_DESCRIPTION = 'A personal story I've been meaning to share. Life-changing perspective on what really matters.';
const VIDEO_THUMBNAIL_URL = 'https://list-manager.bigpoppacode.io/thumbnail-video-2.png';
const EMAIL_SUBJECT = '🔌 Why Your AI Prompts Are Mid (And How to Fix Them)';

// ──────────────────────────────────────────────────────────────────────────

await sendCampaign({
  listName:     'Main Leads',
  campaignName: 'RTTPOC Framework + Video Announcement',
  subject:      EMAIL_SUBJECT,

  async buildEmail({ firstName, contact }) {
    const name = firstName !== 'Friend' ? firstName : (contact?.meta?.['first name'] || 'Friend');
    
    return {
      html: await render(React.createElement(RttpocVideoEmail, { 
        firstName: name,
        videoTitle: VIDEO_TITLE,
        videoUrl: VIDEO_URL,
        videoDescription: VIDEO_DESCRIPTION,
        videoThumbnailUrl: VIDEO_THUMBNAIL_URL,
      })),
      text: await render(React.createElement(RttpocVideoEmail, { 
        firstName: name,
        videoTitle: VIDEO_TITLE,
        videoUrl: VIDEO_URL,
        videoDescription: VIDEO_DESCRIPTION,
      }), { plainText: true }),
    };
  },
});
