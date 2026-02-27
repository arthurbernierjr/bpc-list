# BPC List Manager
**Email list management with MongoDB · CSV upload · Legal unsubscribe · React Email + SES**

## What this does
- Web dashboard to create unlimited email lists
- Upload any CSV — contacts stored in MongoDB
- Unsubscribe system (CAN-SPAM compliant) baked into every email
- Send campaigns via Amazon SES, pulling live from MongoDB
- Unsubscribed contacts are automatically excluded from all sends

---

## 🚀 Quick Start

```bash
npm install
cp .env.example .env       # fill in MongoDB URI + AWS keys
npm start                  # dashboard at http://localhost:3000
```

---

## 📋 Workflow

### 1. Create a list
Open `http://localhost:3000` → click **+ New List**

### 2. Upload your CSV
Click into the list → drag & drop your CSV (or click to browse)

CSV must have: `email`, `first_name` (extra columns stored automatically)

### 3. Send a campaign
```bash
node send-conference.js    # conference attendees
node send-community.js     # 40K community list
```

Make sure the `listName` in the send script matches the list name in your dashboard exactly.

---

## 🔗 Unsubscribe System

Every email sent via `ses-mongo.js` automatically gets:
- An **unsubscribe footer** injected into the HTML
- An **unsubscribe link** appended to plain text
- `List-Unsubscribe` and `List-Unsubscribe-Post` headers (RFC 8058)

The unsubscribe URL format:
```
https://yourdomain.com/unsubscribe?email=user@email.com&list=LISTID
```

When someone clicks it:
1. They see a clean confirmation page (`/unsubscribe`)
2. They click "Yes, Unsubscribe Me"
3. Their `subscribed` field is set to `false` in MongoDB
4. Next time you send a campaign, they're automatically excluded

**For BASE_URL in production:** Set this to your deployed domain, not localhost.

---

## 📁 File Structure

```
bpc-list-manager/
├── .env.example
├── package.json
├── server.js               ← Express API + MongoDB models + unsubscribe routes
├── ses-mongo.js            ← SES sender that reads from MongoDB
├── send-conference.js      ← Campaign 1 send script
├── send-community.js       ← Campaign 2 send script
├── emails/
│   ├── ConferenceEmail.jsx ← React Email template
│   └── CommunityEmail.jsx  ← React Email template
└── public/
    ├── index.html          ← Dashboard UI
    └── unsubscribe.html    ← Unsubscribe confirmation page
```

---

## ⚖️ CAN-SPAM Compliance Checklist

- ✅ Physical address in footer (add yours to the email templates)
- ✅ Unsubscribe link in every email
- ✅ Unsubscribe processed immediately (not a delay)
- ✅ Honest subject lines
- ✅ FROM name identifies the sender

---

## 💰 Cost

| Emails | SES Cost |
|---|---|
| 800 | $0.08 |
| 40,000 | $4.00 |

MongoDB Atlas free tier handles up to 512MB — plenty for your 40K contacts.
