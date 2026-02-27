// send-conference.js — AI Plug Library campaign to conference attendees
// Run: node send-conference.js
// Target: "Conference Attendees" list (~800 contacts)

import { render } from '@react-email/render';
import React from 'react';
import ConferenceEmail from './emails/ConferenceEmail.jsx';
import { sendCampaign } from './ses-mongo.js';

await sendCampaign({
  listName:     'Conference Attendees',
  campaignName: 'AI Plug Library — Conference Attendees',
  subject:      'You showed up. So here\'s everything I\'ve got.',

  async buildEmail({ firstName }) {
    return {
      html: await render(React.createElement(ConferenceEmail, { firstName })),
      text: await render(React.createElement(ConferenceEmail, { firstName }), { plainText: true }),
    };
  },
});
