// send-nyny.js — Send to NYNY Conference Leads list
// Run: npm run send:nyny

import { render } from '@react-email/render';
import React from 'react';
import ConferenceEmail from './emails/ConferenceEmail.jsx';
import { sendCampaign } from './ses-mongo.js';

await sendCampaign({
  listName:     'NYNY Conference Leads',  // Must match list name in dashboard exactly
  campaignName: 'NYNY Conference Follow-up',
  subject:      'It was great meeting you at New Year New You 🎯',

  async buildEmail({ firstName, contact }) {
    // Use first name from top-level or meta as fallback
    const name = firstName !== 'Friend' 
      ? firstName 
      : (contact?.meta?.['First Name'] || contact?.meta?.['first name'] || 'Friend');
    
    return {
      html: await render(React.createElement(ConferenceEmail, { firstName: name })),
      text: await render(React.createElement(ConferenceEmail, { firstName: name }), { plainText: true }),
    };
  },
});



