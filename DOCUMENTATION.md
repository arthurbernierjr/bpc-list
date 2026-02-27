# BPC List Manager — Complete Documentation

**Version:** 1.0.0  
**Purpose:** Email list management system with MongoDB storage, CSV import, CAN-SPAM compliant unsubscribe, and Square payment webhook integration for automated access code fulfillment.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Database Schema](#database-schema)
4. [Server Routes & API](#server-routes--api)
5. [Email System](#email-system)
6. [Authentication & Security](#authentication--security)
7. [Square Webhook Integration](#square-webhook-integration)
8. [Access Code System](#access-code-system)
9. [Frontend Dashboard](#frontend-dashboard)
10. [Campaign Scripts](#campaign-scripts)
11. [Environment Variables](#environment-variables)
12. [Deployment Considerations](#deployment-considerations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BPC List Manager                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │   Express    │────▶│   MongoDB    │────▶│    AWS SES   │        │
│  │   Server     │     │  (Atlas)     │     │  (Emails)    │        │
│  └──────────────┘     └──────────────┘     └──────────────┘        │
│         │                    │                    │                 │
│         │              ┌─────┴─────┐              │                 │
│         │              │           │              │                 │
│         │         ┌────▼───┐ ┌─────▼────┐        │                 │
│         │         │ Lists  │ │ Contacts │        │                 │
│         │         └────────┘ └──────────┘        │                 │
│         │                                        │                 │
│    ┌────▼────────────────────────────────────────▼────┐            │
│    │              Public Endpoints                     │            │
│    │  • /webhook/square (payment processing)          │            │
│    │  • /unsubscribe (CAN-SPAM compliance)            │            │
│    └──────────────────────────────────────────────────┘            │
│                                                                     │
│    ┌─────────────────────────────────────────────────┐             │
│    │              Localhost-Only Endpoints            │             │
│    │  • /api/auth/* (login, verify)                  │             │
│    │  • /api/lists/* (CRUD operations)               │             │
│    │  • /api/contacts/* (management)                 │             │
│    │  • /api/preview/* (email previews)              │             │
│    │  • /api/test-send/* (test emails)               │             │
│    │  • Dashboard UI (index.html)                    │             │
│    └─────────────────────────────────────────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

1. **Localhost-only admin routes** — All management operations require `localhost` access, preventing remote exploitation
2. **Public endpoints limited** — Only Square webhook and unsubscribe are exposed publicly
3. **React Email templates** — JSX-based email templates for maintainable, responsive HTML emails
4. **Single admin user** — Simplicity over complexity; one admin created via CLI script

---

## File Structure

```
bpc-list/
├── server.js              # Main Express server (626 lines)
│                          # - MongoDB models
│                          # - All API routes
│                          # - Localhost detection & middleware
│                          # - Square webhook handler
│
├── ses-mongo.js           # Email sending module (219 lines)
│                          # - SES client configuration
│                          # - Raw email builder with unsubscribe headers
│                          # - Campaign sending function
│
├── emails/                # React Email templates (JSX)
│   ├── AccessCodeEmail.jsx    # Purchase fulfillment email (355 lines)
│   ├── ConferenceEmail.jsx    # Conference attendee campaign (352 lines)
│   └── CommunityEmail.jsx     # Community list campaign (299 lines)
│
├── public/                # Static frontend files
│   ├── index.html         # Dashboard SPA (1442 lines)
│   └── unsubscribe.html   # Unsubscribe confirmation page (180 lines)
│
├── send-conference.js     # Campaign script: Conference Attendees list
├── send-community.js      # Campaign script: Digital Boss Code Community
├── send-main-leads.js     # Campaign script: Main Leads list
├── send-nyny.js           # Campaign script: NYNY Conference Leads
├── test-send.js           # Test script: sends to TEST_EMAIL env var
│
├── create-admin.js        # One-time script to create admin user (91 lines)
├── load-codes.js          # Bulk load access codes from codes.json (119 lines)
│
├── codes.json             # Array of access codes to load
├── package.json           # Dependencies and npm scripts
├── .env                   # Environment variables (gitignored)
├── .env.example           # Template for environment variables
└── .gitignore             # Ignores node_modules, .env, *.csv
```

---

## Database Schema

### MongoDB Collections

#### 1. `admins` Collection

```javascript
{
  email:        String,   // Required, unique, lowercase, trimmed
  passwordHash: String,   // bcrypt hash (12 rounds)
  createdAt:    Date      // Default: Date.now
}
```

**Notes:**
- Only ONE admin allowed (enforced by create-admin.js)
- Password must be at least 8 characters

---

#### 2. `lists` Collection

```javascript
{
  _id:         ObjectId,  // MongoDB auto-generated
  name:        String,    // Required, trimmed
  description: String,    // Optional, default: ''
  createdAt:   Date       // Default: Date.now
}
```

**Notes:**
- List names should match exactly in campaign scripts (case-insensitive search)
- Deleting a list also deletes all associated contacts

---

#### 3. `contacts` Collection

```javascript
{
  _id:           ObjectId,
  email:         String,    // Required, lowercase, trimmed
  firstName:     String,    // Default: 'Friend'
  lastName:      String,    // Default: ''
  phone:         String,    // Default: ''
  source:        String,    // Default: '' (e.g., 'Conference 2025')
  listId:        ObjectId,  // Required, references Lists
  subscribed:    Boolean,   // Default: true
  unsubscribedAt: Date,     // Set when unsubscribed
  createdAt:     Date,      // Default: Date.now
  meta:          Mixed      // Extra CSV columns stored here
}
```

**Indexes:**
- Compound unique index on `{ email: 1, listId: 1 }` — same email can be in multiple lists

**Notes:**
- `meta` field stores any CSV columns not explicitly mapped
- `firstName: 'Friend'` is the fallback when no name is provided

---

#### 4. `accesscodes` Collection

```javascript
{
  _id:       ObjectId,
  code:      String,    // Required, unique, trimmed (e.g., "AIPL-XXXX-XXXX")
  used:      Boolean,   // Default: false
  usedAt:    Date,      // Set when code is claimed
  usedBy:    String,    // Buyer's email address
  orderId:   String,    // Square order ID
  createdAt: Date       // Default: Date.now
}
```

**Notes:**
- Codes are atomically claimed using `findOneAndUpdate` to prevent race conditions
- When codes run out, an alert email is sent to admin

---

## Server Routes & API

### Public Routes (Accessible from anywhere)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/webhook/square` | Square payment webhook (signature verified) |
| `GET` | `/unsubscribe` | Serves unsubscribe.html |
| `POST` | `/unsubscribe` | Process unsubscribe request |
| `POST` | `/unsubscribe/oneclick` | RFC 8058 one-click unsubscribe |

### Localhost-Only Routes (Return 404 if accessed remotely)

#### Authentication

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/login` | No | Login with email/password, returns JWT |
| `GET` | `/api/auth/verify` | JWT | Verify token is valid |

**Login Request:**
```json
{ "email": "admin@example.com", "password": "yourpassword" }
```

**Login Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": { "email": "admin@example.com" }
}
```

---

#### Lists Management

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/lists` | JWT | Get all lists with contact counts |
| `POST` | `/api/lists` | JWT | Create new list |
| `DELETE` | `/api/lists/:id` | JWT | Delete list and all its contacts |
| `POST` | `/api/lists/:id/upload` | JWT | Upload CSV to import contacts |
| `GET` | `/api/lists/:id/contacts` | JWT | Get paginated contacts |

**Create List Request:**
```json
{ "name": "Conference 2025", "description": "NYC event attendees" }
```

**Lists Response:**
```json
[
  {
    "_id": "...",
    "name": "Conference Attendees",
    "description": "",
    "createdAt": "2025-...",
    "total": 800,
    "subscribed": 795,
    "unsubscribed": 5
  }
]
```

---

#### Contacts Management

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/lists/:id/contacts` | JWT | Paginated contacts (50 per page) |
| `DELETE` | `/api/contacts/:id` | JWT | Delete single contact |

**Query Parameters:**
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 50)
- `subscribed=false` — Filter to unsubscribed only

---

#### Email Preview & Testing

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/preview/:templateName` | JWT | Render email template as HTML |
| `POST` | `/api/test-send/:templateName` | JWT | Send test email to TEST_EMAILS |

**Template Names:** `conference`, `community`, `accesscode`

---

#### Access Code Stats

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/access-codes/stats` | JWT | Get total/used/available counts |

**Response:**
```json
{ "total": 500, "used": 127, "available": 373 }
```

---

## Email System

### ses-mongo.js Module

**Exports:**

1. **`List`** — Mongoose model for lists
2. **`Contact`** — Mongoose model for contacts
3. **`connectDB()`** — Connect to MongoDB (if not already connected)
4. **`sesClient`** — AWS SES client instance
5. **`sendEmail({ toEmail, toName, subject, htmlBody, textBody, listId, transactional })`** — Send single email
6. **`sendCampaign({ listName, subject, buildEmail, campaignName })`** — Send to entire list

### Email Types

**Marketing Emails (transactional: false):**
- Include `List-Unsubscribe` header (RFC 8058)
- Include `List-Unsubscribe-Post` header for one-click
- Unsubscribe footer injected into HTML body
- Unsubscribe link appended to plain text

**Transactional Emails (transactional: true):**
- No unsubscribe headers or footer
- Used for purchase confirmations (AccessCodeEmail)
- Cannot be unsubscribed from

### Raw Email Format

Emails are sent as raw MIME multipart/alternative with:
- UTF-8 encoded subject (Base64 if non-ASCII)
- Plain text part
- HTML part
- Proper boundary separators

---

## Authentication & Security

### Security Layers

1. **Localhost Detection:**
   ```javascript
   function isLocalhost(req) {
     const host = req.hostname || req.host || '';
     const ip = req.ip || req.connection?.remoteAddress || '';
     const localhostHosts = ['localhost', '127.0.0.1', '::1'];
     const localhostIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
     return localhostHosts.includes(host) || localhostIPs.includes(ip);
   }
   ```

2. **JWT Authentication:**
   - 7-day expiry
   - Stored in localStorage on frontend
   - Sent via `Authorization: Bearer <token>` header

3. **Rate Limiting:**
   - Square webhook: 30 requests/minute (allows retries)

4. **Helmet Security Headers:**
   - CSP, X-Frame-Options, etc.

5. **Square Webhook Signature Verification:**
   - HMAC-SHA256 signature validation
   - Uses notification URL + payload

### Admin Creation

```bash
# Set in .env first:
# ADMIN_EMAIL=admin@example.com
# ADMIN_PASSWORD=secure_password_here
# JWT_SECRET=random_string_at_least_32_chars

npm run create-admin
# After creation, DELETE create-admin.js for security
```

---

## Square Webhook Integration

### Flow Diagram

```
Square Payment → POST /webhook/square
                       │
                       ▼
              Verify HMAC signature
                       │
                       ▼
              Check event type = 'payment.completed'
                       │
                       ▼
              Verify amount = $197.00 (19700 cents)
                       │
                       ▼
              Atomically claim unused access code
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      Code Available       No Codes Left
             │                   │
             ▼                   ▼
      Send AccessCodeEmail    Send Alert Email
      to buyer                to FROM_EMAIL
```

### Key Implementation Details

- **Atomic code claiming:** Uses `findOneAndUpdate` with `{ used: false }` filter
- **Amount verification:** Only processes $197.00 payments (launch price)
- **Alert system:** Notifies admin when codes run out
- **Name extraction:** Extracts first name from email prefix
  ```javascript
  const firstName = buyerEmail.split('@')[0].split(/[._-]/)[0];
  ```

---

## Access Code System

### Loading Codes

Create `codes.json` as a flat array:
```json
["AIPL-0001-XXXX", "AIPL-0002-XXXX", "AIPL-0003-XXXX"]
```

Run:
```bash
npm run load-codes
```

Features:
- Idempotent — duplicates are silently skipped
- Uses `$setOnInsert` for safe upsert
- Outputs stats after loading

### Code Lifecycle

1. **Created:** `used: false`, no `usedAt`, `usedBy`, `orderId`
2. **Claimed:** `used: true`, `usedAt: Date`, `usedBy: email`, `orderId: Square order ID`

---

## Frontend Dashboard

### Pages/Views

1. **Login Screen** — Email/password form, JWT stored in localStorage
2. **Lists View** — Sidebar with lists, main panel with contacts table
3. **Campaigns View** — Email previews with test send buttons, access code stats

### Features

- **CSV Upload:** Drag-and-drop or click to browse
- **Smart Field Mapping:** Handles various CSV column name formats:
  ```javascript
  // Email variations
  row.email || row.Email || row.EMAIL
  
  // First name variations
  row['first name'] || row['First Name'] || row.first_name || 
  row.firstName || row.firstname || row.name || row.Name
  
  // ... similar for lastName, phone, source
  ```
- **Meta Field Storage:** Unknown columns stored in `contact.meta`
- **Pagination:** 50 contacts per page with nav buttons
- **Real-time Stats:** Subscribed/unsubscribed counts

### UI Components

- Toast notifications (success/error)
- Progress bar for uploads
- Modal for creating lists
- Badge system for status (Active/Unsubscribed)

---

## Campaign Scripts

All campaign scripts follow the same pattern:

```javascript
import { render } from '@react-email/render';
import React from 'react';
import TemplateEmail from './emails/TemplateEmail.jsx';
import { sendCampaign } from './ses-mongo.js';

await sendCampaign({
  listName:     'Exact List Name',  // Must match dashboard
  campaignName: 'Campaign Description',
  subject:      'Email Subject Line',

  async buildEmail({ firstName, contact }) {
    return {
      html: await render(<TemplateEmail firstName={firstName} />),
      text: await render(<TemplateEmail firstName={firstName} />, { plainText: true }),
    };
  },
});
```

### Available Scripts

| Script | Command | Target List | Template |
|--------|---------|-------------|----------|
| `send-conference.js` | `npm run send:conference` | Conference Attendees | ConferenceEmail |
| `send-community.js` | `npm run send:community` | Digital Boss Code Community | CommunityEmail |
| `send-main-leads.js` | `npm run send:main-leads` | Main Leads | CommunityEmail |
| `send-nyny.js` | `npm run send:nyny` | NYNY Conference Leads | ConferenceEmail |
| `test-send.js` | `npm run test:send` | (Test email addresses) | Both templates |

### Sending Behavior

- **Batch size:** 10 emails per batch
- **Delay:** 1.1 seconds between batches (SES rate limiting)
- **Filtering:** Only `subscribed: true` contacts
- **Progress logging:** Real-time console output

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bpc-lists

# ═══════════════════════════════════════════════════════════════════
# SERVER
# ═══════════════════════════════════════════════════════════════════
PORT=3000                               # Server port
BASE_URL=https://yourdomain.com         # Used in unsubscribe links

# ═══════════════════════════════════════════════════════════════════
# AWS SES
# ═══════════════════════════════════════════════════════════════════
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1                    # SES region

# ═══════════════════════════════════════════════════════════════════
# EMAIL SENDER
# ═══════════════════════════════════════════════════════════════════
FROM_EMAIL=arthur@yourdomain.com        # Must be SES verified
FROM_NAME=Big Poppa Code

# ═══════════════════════════════════════════════════════════════════
# SOCIAL LINKS (used in email templates)
# ═══════════════════════════════════════════════════════════════════
YOUTUBE_URL=https://youtube.com/@BigPoppaCode
INSTAGRAM_URL=https://instagram.com/BigPoppaCode
TWITTER_URL=https://twitter.com/BigPoppaCode
LINKEDIN_URL=https://linkedin.com/in/BigPoppaCode
PODCAST_URL=https://deeperthancode.com
COMMUNITY_URL=https://digitalbosscode.com

# ═══════════════════════════════════════════════════════════════════
# PRODUCT LINKS (used in email templates)
# ═══════════════════════════════════════════════════════════════════
LIBRARY_URL=https://theaipluglibrary.com
SESSION_URL=https://theaipluglibrary.com/session
BOOK_URL=https://your-book-download-link.com

# ═══════════════════════════════════════════════════════════════════
# SQUARE INTEGRATION
# ═══════════════════════════════════════════════════════════════════
SQUARE_WEBHOOK_SIGNATURE_KEY=...        # From Square Dashboard

# ═══════════════════════════════════════════════════════════════════
# TESTING
# ═══════════════════════════════════════════════════════════════════
TEST_EMAILS=email1@test.com,email2@test.com   # Comma-separated

# ═══════════════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════════════
ADMIN_EMAIL=admin@bigpoppacode.com
ADMIN_PASSWORD=your_secure_password     # Min 8 characters
JWT_SECRET=random_string_32_chars_min   # For signing JWTs
```

---

## Deployment Considerations

### Production Security

1. **Reverse proxy required** — Use nginx/Caddy for SSL and forwarding
2. **Trust proxy enabled** — Server has `app.set('trust proxy', true)`
3. **Dashboard protection** — Dashboard only serves on localhost
4. **Webhook exposure** — Only `/webhook/square` and `/unsubscribe` are public

### Nginx Example

```nginx
server {
    server_name yourdomain.com;
    
    # Only expose webhook and unsubscribe
    location /webhook/square {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /unsubscribe {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Block everything else
    location / {
        return 404;
    }
}
```

### Monitoring

Check access code inventory regularly:
- View in dashboard Campaigns tab
- Query MongoDB: `db.accesscodes.countDocuments({ used: false })`

### Cost Estimates

| Service | Usage | Cost |
|---------|-------|------|
| AWS SES | 40,000 emails | ~$4.00 |
| MongoDB Atlas | Free tier (512MB) | $0.00 |
| Square | Per transaction | 2.9% + $0.30 |

---

## Quick Reference: npm Scripts

```bash
npm start              # Start server (production)
npm run dev            # Start server with --watch (development)
npm run create-admin   # Create admin user from .env
npm run load-codes     # Load access codes from codes.json
npm run test:send      # Send test emails to TEST_EMAILS
npm run send:conference   # Send ConferenceEmail to Conference Attendees
npm run send:community    # Send CommunityEmail to Digital Boss Code Community
npm run send:main-leads   # Send to Main Leads list
npm run send:nyny         # Send to NYNY Conference Leads
```

---

## Troubleshooting

### Common Issues

**"Unauthorized — no token provided"**
- Login again; JWT may have expired (7 days)

**"List not found: ..."**
- List name in campaign script must match dashboard exactly (case-insensitive)

**"No unused access codes remaining"**
- Load more codes with `npm run load-codes`
- Check codes.json has valid array of strings

**Email not sending**
- Verify FROM_EMAIL is SES verified
- Check AWS credentials in .env
- Review SES sending limits

**Webhook signature invalid**
- Verify SQUARE_WEBHOOK_SIGNATURE_KEY matches Square dashboard
- Check BASE_URL matches the exact URL Square is calling

---

*Documentation generated for bpc-list v1.0.0*
