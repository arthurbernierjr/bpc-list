// send-community.js — AI Plug Library campaign to community list
// Run: node send-community.js
// Target: "Digital Boss Code Community" list (~40,000 contacts)

import { render } from '@react-email/render';
import React from 'react';
import CommunityEmail from './emails/CommunityEmail.jsx';
import { sendCampaign } from './ses-mongo.js';

await sendCampaign({
  listName:     'Digital Boss Code Community',
  campaignName: 'AI Plug Library — Community',
  subject:      'Love, Cancer, and AI Automation',

  async buildEmail({ firstName }) {
    return {
      html: await render(React.createElement(CommunityEmail, { firstName })),
      text: await render(React.createElement(CommunityEmail, { firstName }), { plainText: true }),
    };
  },
});
