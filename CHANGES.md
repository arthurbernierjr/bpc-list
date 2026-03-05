# BPC-List Email Tracking Implementation

**Date:** March 3, 2026  
**Developer:** Aurelius  
**Goal:** Add open tracking, click tracking, preview links, and campaign stats dashboard

---

## 🎯 Features Being Added

1. **Open Tracking** - 1x1 pixel to detect email opens
2. **Click Tracking** - Rewrite links to track clicks
3. **Preview Links** - Shareable public preview URLs
4. **Campaign Stats Dashboard** - See opens/clicks per campaign

---

## 📋 Implementation Log

### Step 1: Setup - Installing Dependencies
**Status:** ✅ COMPLETE  
**Files:** package.json  

**Action:** Adding `cheerio` for HTML parsing (needed for link rewriting)

```bash
npm install cheerio
```

---

### Step 2: Database Models
**Status:** ✅ COMPLETE  
**Files:** server.js (lines ~117-166)

**Action:** Added 4 new MongoDB models for tracking and previews

**Models Added:**

1. **Campaign** - Track sent campaigns
```javascript
{
  name:         String,    // e.g., "Conference Feb 2026"
  subject:      String,    // Email subject
  listId:       ObjectId,  // Reference to list
  templateName: String,    // e.g., "conference"
  sentAt:       Date,
  totalSent:    Number,
  totalFailed:  Number,
  createdAt:    Date
}
```

2. **TrackingToken** - Map tokens to contacts/campaigns
```javascript
{
  token:      String (unique, indexed),  // UUID v4
  campaignId: ObjectId,
  contactId:  ObjectId,
  tokenType:  'open' | 'click',
  targetUrl:  String,  // for click tokens only
  createdAt:  Date
}
```

3. **EmailEvent** - Log open/click events
```javascript
{
  campaignId: ObjectId,
  contactId:  ObjectId,
  eventType:  'open' | 'click',
  timestamp:  Date,
  url:        String,      // for clicks
  userAgent:  String,
  ip:         String
}
// Compound index on campaignId + contactId + eventType
```

4. **EmailPreview** - Shareable preview links
```javascript
{
  token:        String (unique, indexed),  // UUID v4
  templateName: String,
  sampleData:   Object,  // { firstName: 'John', ... }
  createdAt:    Date,
  expiresAt:    Date     // Auto-expire after 7 days
}
```

---

---

### Step 3: Public Tracking Routes
**Status:** ✅ COMPLETE  
**Files:** server.js (lines ~625-720)

**Action:** Added 3 public routes for email tracking and previews

**Routes Added:**

1. **GET /track/open/:token** - Track email opens
   - Returns 1x1 transparent GIF (always, even on error)
   - Logs EmailEvent with type 'open' (deduped by campaignId+contactId)
   - Captures userAgent and IP address
   - No authentication required (must work from email clients)

2. **GET /track/click/:token** - Track link clicks
   - Looks up original URL from TrackingToken
   - Logs EmailEvent with type 'click'
   - Redirects to original URL (302)
   - No authentication required

3. **GET /preview/:token** - Public email preview
   - Validates token exists and not expired
   - Renders email template with sample data
   - Returns HTML
   - No authentication required (shareable links)

---

### Step 4: Admin Routes for Campaigns & Previews
**Status:** ✅ COMPLETE  
**Files:** server.js (lines ~625-790)

**Action:** Added 3 localhost-only admin routes

**Routes Added:**

1. **POST /api/preview/create** - Generate shareable preview link
   - Requires: templateName, optional sampleData
   - Creates EmailPreview with 7-day expiry
   - Returns: previewUrl, expiresAt

2. **GET /api/campaigns** - List all campaigns with stats
   - Returns array of campaigns sorted by sentAt (desc)
   - Calculates for each:
     - uniqueOpens, uniqueClicks
     - openRate, clickRate, clickToOpenRate
   - Populates list name

3. **GET /api/campaigns/:id/stats** - Detailed campaign stats
   - Returns campaign info + per-contact breakdown
   - Shows who opened, who clicked, which URLs clicked
   - Sorted by most recent activity

---

---

### Step 5: Email Tracking Implementation
**Status:** ✅ COMPLETE  
**Files:** ses-mongo.js (major modifications)

**Action:** Added tracking pixel injection, link rewriting, and campaign creation

**Changes Made:**

1. **Added imports:**
   - `crypto` - for generating UUIDs
   - `cheerio` - for HTML parsing/manipulation

2. **Added models:** Campaign, TrackingToken (imported in ses-mongo.js)

3. **New helper functions:**
   - `rewriteLinksWithTracking(htmlBody, campaignId, contactId)`
     - Uses cheerio to parse HTML
     - Finds all `<a href="...">` links
     - Skips: anchors (#), mailto:, tel:, /track/, /unsubscribe
     - Generates UUID token for each link
     - Rewrites href to `/track/click/:token`
     - Creates TrackingToken documents in bulk
   
   - `injectTrackingPixel(htmlBody, token)`
     - Creates 1x1 transparent `<img>` tag
     - URL: `/track/open/:token`
     - Injects before `</body>` tag (or appends if no body tag)

4. **Modified sendEmail() function:**
   - Added parameters: `campaignId`, `contactId` (optional)
   - When both provided:
     - Calls `rewriteLinksWithTracking()` to rewrite all links
     - Generates open tracking token (UUID)
     - Creates TrackingToken document for open tracking
     - Calls `injectTrackingPixel()` to add tracking pixel
   - Tracking happens AFTER unsubscribe footer injection
   - Works seamlessly with existing transactional email logic

5. **Modified sendCampaign() function:**
   - Added parameter: `templateName` (default: 'unknown')
   - Creates Campaign document BEFORE sending emails
   - Logs campaign ID to console
   - Passes `campaignId` and `contactId` to each sendEmail() call
   - Updates Campaign.totalSent and Campaign.totalFailed after completion
   - Logs campaign stats confirmation to console

**Flow:**
```
sendCampaign() 
  → Create Campaign document
  → For each contact:
    → buildEmail() (React Email)
    → Add unsubscribe footer
    → rewriteLinksWithTracking() (all <a> tags)
    → injectTrackingPixel()
    → Send via SES
  → Update Campaign stats
```

---

---

### Step 6: Campaign Scripts Update
**Status:** ✅ COMPLETE  
**Files:** send-conference.js, send-community.js, send-main-leads.js, send-nyny.js

**Action:** Added `templateName` parameter to all campaign scripts

**Changes:**
- Added `templateName: 'conference'` to send-conference.js and send-nyny.js
- Added `templateName: 'community'` to send-community.js and send-main-leads.js
- This parameter gets stored in Campaign document for filtering/analytics

---

### Step 7: Dashboard UI Updates
**Status:** ✅ COMPLETE  
**Files:** public/index.html (multiple sections)

**Action:** Added campaign history table, preview link generation, and enhanced UI

**Changes Made:**

1. **Added Campaign History Section** (line ~889)
   - New `<div id="campaignsHistory">` container
   - Displays table of all sent campaigns
   - Columns: Campaign, List, Sent Date, Total, Opens, Open %, Clicks, Click %
   - Color-coded metrics (green for good performance, yellow for poor)

2. **Enhanced Template Preview Cards** (lines ~905-950)
   - Added "Generate Preview Link" buttons
   - Added result containers for shareable links
   - Both templates (Conference & Community) now have preview link generation

3. **New JavaScript Functions:**

   a. **loadCampaignsHistory()** (lines ~1077-1140)
      - Fetches `/api/campaigns`
      - Renders campaign table with stats
      - Shows "No campaigns sent yet" if empty
      - Color-codes open rates (green if >20%, yellow if lower)
      - Color-codes click rates (green if >5%)
   
   b. **generatePreviewLink(templateName)** (lines ~1143-1185)
      - Calls `/api/preview/create` with template name
      - Shows shareable URL in readonly input (click to select)
      - Displays expiry date
      - Provides "Open →" link to test immediately
      - Button states: "🔗 Generating..." → "🔗 Generate Preview Link"

4. **Modified switchView()** (line ~1026)
   - Added call to `loadCampaignsHistory()` when switching to campaigns view
   - Campaigns view now loads: previews + access codes + campaign history

**UI Flow:**
- User switches to "📧 Campaigns" tab
- Three sections load:
  1. Access Code Inventory (existing)
  2. **Sent Campaigns** (new - table with stats)
  3. Email Template Previews (enhanced with preview link buttons)

---

## 🗂️ Files Modified (Final Summary)

**Modified Files:**
- [x] package.json (cheerio dependency added)
- [x] server.js (4 new models + 7 new routes)
- [x] ses-mongo.js (tracking pixel + link rewriting + campaign creation)
- [x] send-conference.js (templateName added)
- [x] send-community.js (templateName added)
- [x] send-main-leads.js (templateName added)
- [x] send-nyny.js (templateName added)
- [x] public/index.html (campaign history + preview links)

**New Files Created:**
- [x] create-email-script.js (CLI tool for generating campaign scripts)

---

### Step 8: CLI Script Generator
**Status:** ✅ COMPLETE  
**Files:** create-email-script.js (new file)

**Action:** Created command-line tool to generate campaign scripts automatically

**Usage:**
```bash
node create-email-script.js -template <template> -list <list-name> -name <script-name>
```

**Example:**
```bash
node create-email-script.js -template ConferenceEmail -list "NYNY Conference Leads" -name nyny-followup
```

**What it does:**
1. **Dynamically discovers templates:**
   - Scans `emails/` directory for .jsx files
   - Shows available templates in help text and error messages
   - Accepts template names with or without .jsx extension
   - Case-insensitive matching (ConferenceEmail = conferenceemail = CONFERENCEEMAIL)

2. **Validates inputs:**
   - Template must exist in `emails/` directory
   - Script name must be lowercase-with-dashes
   - Checks if file already exists (prevents overwrite)

3. **Creates campaign script file:**
   - Filename: `send-{script-name}.js`
   - Pre-configured with:
     - Correct email component import (exact filename from emails/)
     - List name from CLI arg
     - Default subject line
     - Proper templateName for tracking (auto-generated: lowercase, removes "Email" suffix)
     - Name fallback logic for personalization

4. **Updates package.json:**
   - Adds npm script: `"send:{script-name}": "node send-{script-name}.js"`
   - Maintains JSON formatting
   - Warns if script already exists

**Features:**
- Help text if args missing
- Dynamic template discovery (no hardcoded list)
- Input validation (template existence, script name format)
- Success messages with next steps
- Script details summary
- Executable with chmod +x

**Template tracking names (auto-generated):**
- `ConferenceEmail` → tracking name: `conference`
- `CommunityEmail` → tracking name: `community`
- `AccessCodeEmail` → tracking name: `accesscode`
- `YouTubeVideoEmail` → tracking name: `youtubevideo`
- Any new email template → automatically supported!

**Generated script structure:**
```javascript
import { render } from '@react-email/render';
import React from 'react';
import ConferenceEmail from './emails/ConferenceEmail.jsx';
import { sendCampaign } from './ses-mongo.js';

await sendCampaign({
  listName:     'Your List Name',
  campaignName: 'Script Name',
  subject:      'Default Subject',
  templateName: 'conference',

  async buildEmail({ firstName, contact }) {
    const name = firstName !== 'Friend' 
      ? firstName 
      : (contact?.meta?.['First Name'] || 'Friend');
    
    return {
      html: await render(React.createElement(ConferenceEmail, { firstName: name })),
      text: await render(React.createElement(ConferenceEmail, { firstName: name }), { plainText: true }),
    };
  },
});
```

---

## ✅ IMPLEMENTATION COMPLETE

**Total time:** ~5 hours (including CLI generator)

---

## 🧪 Testing Checklist

Before using in production, test these flows:

### 1. Test Email Sending with Tracking
```bash
# Use test-send.js with a small test list
npm run test:send
```

**Verify:**
- [ ] Email received
- [ ] Tracking pixel present in HTML (`<img src=".../track/open/..."`)
- [ ] All links rewritten to `/track/click/...`
- [ ] Unsubscribe link NOT rewritten (should stay `/unsubscribe`)

### 2. Test Open Tracking
- [ ] Open email in Gmail/Outlook
- [ ] Check browser network tab - should see request to `/track/open/:token`
- [ ] Returns 1x1 transparent GIF
- [ ] Check MongoDB `emailevents` collection - should have entry with `eventType: 'open'`

### 3. Test Click Tracking
- [ ] Click a link in the email (NOT unsubscribe)
- [ ] Should redirect to original URL
- [ ] Check MongoDB `emailevents` collection - should have entry with `eventType: 'click'`
- [ ] Event should include original URL in `url` field

### 4. Test Dashboard Campaign Stats
- [ ] Login to dashboard (localhost:3000)
- [ ] Switch to "📧 Campaigns" tab
- [ ] Verify campaign appears in "Sent Campaigns" table
- [ ] Check stats: Total Sent, Opens, Open %, Clicks, Click %
- [ ] Open % and Click % should be calculated correctly

### 5. Test Preview Link Generation
- [ ] Click "🔗 Generate Preview Link" on a template card
- [ ] Should show shareable URL
- [ ] Copy URL and open in incognito/private window (no auth)
- [ ] Should render email HTML
- [ ] Check MongoDB `emailpreviews` collection - should have token

### 6. Test Preview Link Expiry
- [ ] Manually update a preview document in MongoDB:
   ```javascript
   db.emailpreviews.updateOne(
     { token: 'YOUR_TOKEN' },
     { $set: { expiresAt: new Date('2020-01-01') } }
   )
   ```
- [ ] Try to open that preview URL
- [ ] Should show "Preview link expired" (410 status)

---

## 📊 Expected Database State After Test Campaign

**Collections Created:**
1. **campaigns** - One document per campaign sent
2. **trackingtokens** - One per email sent (open token) + one per link per email (click tokens)
3. **emailevents** - Events logged when opens/clicks happen
4. **emailpreviews** - Preview links generated from dashboard

**Example Campaign Stats:**
- 10 emails sent
- 7 opens (70% open rate)
- 3 clicks (30% click rate)
- 42.9% click-to-open rate

---

## 🔧 Troubleshooting

**"Campaign not showing in dashboard"**
- Check MongoDB - campaign document created?
- Run: `db.campaigns.find().pretty()`
- Verify `totalSent > 0`

**"Open tracking not working"**
- Check email HTML source - is pixel there?
- Look for: `<img src="https://yourdomain.com/track/open/..."`
- Check server logs when opening email

**"Links not redirecting"**
- Verify link was rewritten in email HTML
- Check MongoDB `trackingtokens` - should have entries with `tokenType: 'click'`
- Check server logs when clicking link

**"Preview link not generating"**
- Check browser console for errors
- Verify you're on localhost (admin routes blocked remotely)
- Check MongoDB connection

---

## 📝 Detailed Changes (Updated Per Step)
