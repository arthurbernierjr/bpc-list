// send-main-leads.js — Send to Main Leads list
// Run: npm run send:main-leads

import { render } from '@react-email/render';
import React from 'react';
import CommunityEmail from './emails/CommunityEmail.jsx';
import { sendCampaign } from './ses-mongo.js';

await sendCampaign({
  listName:     'Main Leads',           // Must match list name in dashboard exactly
  campaignName: 'Main Leads Campaign',
  subject:      'The Silver Play Button just hit — and Season 2 is coming 🥈🎙️',

  async buildEmail({ firstName, contact }) {
    // You can use contact.meta for additional personalization
    // e.g., contact.meta.source, contact.meta['first name'], etc.
    const name = firstName !== 'Friend' ? firstName : (contact?.meta?.['first name'] || 'Friend');
    
    return {
      html: render(<CommunityEmail firstName={name} />),
      text: render(<CommunityEmail firstName={name} />, { plainText: true }),
    };
  },
});



