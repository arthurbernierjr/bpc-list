# YouTube Video Email Guide

## Overview

Send professional email announcements to your Main Leads list whenever you publish a new YouTube video.

## Template Features

**Email includes:**
- Video title and description with prominent "Watch Now" CTA
- Three secondary CTAs:
  - 📺 Subscribe on YouTube
  - 🔌 Get The AI Plug Library ($197)
  - 🤝 Partner or Contract AI Plug Labs

**Styling:**
- Matches your existing BPC List Manager branding
- Big Poppa Code header with silver accents
- YouTube blue accent color for video highlight
- Mobile-responsive design
- Professional serif typography

## How to Use

### 1. Edit the Video Details

Open `send-youtube-video.js` and customize these values:

```javascript
const VIDEO_TITLE = 'Your Video Title Here';
const VIDEO_URL = 'https://youtube.com/watch?v=YOUR_VIDEO_ID';
const VIDEO_DESCRIPTION = 'Brief description of what the video covers.';
const EMAIL_SUBJECT = '🎥 New Video: Your Video Title Here';
```

### 2. Send the Campaign

```bash
npm run send:youtube-video
```

The email will be sent to all contacts on your **Main Leads** list.

### 3. Verify Before Sending

To test the email before sending to your full list:
1. Use `npm run test:send` to send a test email to yourself
2. Verify formatting, links, and personalization
3. Once confirmed, run the full campaign

## Email Personalization

- Uses `firstName` for personalization (defaults to "Friend" if not available)
- Falls back to `contact.meta['first name']` if available
- All three CTAs use environment variables for URLs (configurable in `.env`)

## Environment Variables

Make sure these are set in your `.env` file:

```env
YOUTUBE_URL=https://youtube.com/@bigpoppacode
LIBRARY_URL=https://theaipluglibrary.com/purchase
PARTNER_URL=https://theaipluglibrary.com/session
```

## Template Files

- **Email Template:** `emails/YouTubeVideoEmail.jsx`
- **Sender Script:** `send-youtube-video.js`
- **NPM Script:** `send:youtube-video`

## Customization Tips

### Change the CTA URLs
Edit the constants in `YouTubeVideoEmail.jsx`:
```javascript
const YOUTUBE_URL = process.env.YOUTUBE_URL || 'https://youtube.com/@bigpoppacode';
const LIBRARY_URL = process.env.LIBRARY_URL || 'https://theaipluglibrary.com/purchase';
const PARTNER_URL = process.env.PARTNER_URL || 'https://theaipluglibrary.com/session';
```

### Modify the Styling
All styles are defined at the bottom of `YouTubeVideoEmail.jsx`. Key colors:
- `accent = '#4a90e2'` - YouTube blue
- `silver = '#C0C0C0'` - Brand silver
- `gold = '#FFD700'` - Accent gold

### Update CTA Text
Edit the CTA blocks in the `ctaSection` of `YouTubeVideoEmail.jsx`.

## Best Practices

1. **Keep video descriptions short** - 1-2 sentences max
2. **Use compelling subject lines** - Include emoji and video title
3. **Test first** - Always send a test email before the full campaign
4. **Timing** - Send within 24 hours of video publish for best engagement
5. **Frequency** - Don't send for every video if you publish daily; batch weekly highlights

## Example Usage

```javascript
// For a video about Claude AI automation
const VIDEO_TITLE = 'Build a Full-Stack App with Claude in 10 Minutes';
const VIDEO_URL = 'https://youtube.com/watch?v=abc123def456';
const VIDEO_DESCRIPTION = 'Watch me vibecode a complete MERN stack application using Claude AI. No frameworks, just pure automation.';
const EMAIL_SUBJECT = '🎥 New Video: Build a Full-Stack App with Claude in 10 Minutes';
```

---

**Created:** March 2, 2026  
**Template:** YouTubeVideoEmail.jsx  
**Sender:** send-youtube-video.js  
**List:** Main Leads
