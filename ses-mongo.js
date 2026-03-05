// ses-mongo.js — SES sender that reads from MongoDB + injects unsubscribe links + tracking
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import mongoose from 'mongoose';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import 'dotenv/config';

// ─── MONGOOSE MODELS ──────────────────────────────────────────────────────────
const ListSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now },
});

const ContactSchema = new mongoose.Schema({
  email:      { type: String, required: true, lowercase: true },
  firstName:  { type: String, default: 'Friend' },
  listId:     { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
  subscribed: { type: Boolean, default: true },
  meta:       { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt:  { type: Date, default: Date.now },
});

const CampaignSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  subject:      { type: String, required: true },
  listId:       { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
  templateName: { type: String, required: true },
  sentAt:       { type: Date, default: Date.now },
  totalSent:    { type: Number, default: 0 },
  totalFailed:  { type: Number, default: 0 },
});

const TrackingTokenSchema = new mongoose.Schema({
  token:      { type: String, required: true, unique: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  contactId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  tokenType:  { type: String, enum: ['open', 'click'] },
  targetUrl:  { type: String },
});

export const List          = mongoose.models.List          || mongoose.model('List', ListSchema);
export const Contact       = mongoose.models.Contact       || mongoose.model('Contact', ContactSchema);
export const Campaign      = mongoose.models.Campaign      || mongoose.model('Campaign', CampaignSchema);
export const TrackingToken = mongoose.models.TrackingToken || mongoose.model('TrackingToken', TrackingTokenSchema);

// ─── CONNECT ──────────────────────────────────────────────────────────────────
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  MongoDB connected');
}

// ─── SES CLIENT ───────────────────────────────────────────────────────────────
export const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ─── TRACKING HELPERS ─────────────────────────────────────────────────────────

// Rewrite all links in HTML to tracking URLs
async function rewriteLinksWithTracking(htmlBody, campaignId, contactId) {
  const $ = cheerio.load(htmlBody);
  const trackingTokens = [];
  
  // Find all <a> tags with href
  $('a[href]').each((i, elem) => {
    const $link = $(elem);
    const originalUrl = $link.attr('href');
    
    // Skip anchor links, mailto, tel, and already-tracked links
    if (!originalUrl || 
        originalUrl.startsWith('#') || 
        originalUrl.startsWith('mailto:') || 
        originalUrl.startsWith('tel:') ||
        originalUrl.includes('/track/') ||
        originalUrl.includes('/unsubscribe')) {
      return;
    }
    
    // Generate unique token for this link
    const token = crypto.randomUUID();
    const trackingUrl = `${process.env.BASE_URL}/track/click/${token}`;
    
    // Store token info for DB insertion
    trackingTokens.push({
      token,
      campaignId,
      contactId,
      tokenType: 'click',
      targetUrl: originalUrl,
    });
    
    // Rewrite the link
    $link.attr('href', trackingUrl);
  });
  
  // Save all tracking tokens to database
  if (trackingTokens.length > 0) {
    await TrackingToken.insertMany(trackingTokens);
  }
  
  return $.html();
}

// Inject tracking pixel before </body>
function injectTrackingPixel(htmlBody, token) {
  const pixelUrl = `${process.env.BASE_URL}/track/open/${token}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;" />`;
  
  if (htmlBody.includes('</body>')) {
    return htmlBody.replace('</body>', `${pixel}</body>`);
  }
  
  // If no </body> tag, append at end
  return htmlBody + pixel;
}

// ─── BUILD RAW EMAIL WITH UNSUBSCRIBE HEADERS ─────────────────────────────────
function buildRawEmail({ from, to, subject, htmlBody, textBody, unsubUrl }) {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  const encodedSubject = /[^\x00-\x7F]/.test(subject) 
    ? `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`
    : subject;

  const rawEmail = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `List-Unsubscribe: <${unsubUrl}>`,
    `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    textBody,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  return rawEmail;
}

// ─── BUILD RAW EMAIL WITHOUT UNSUB HEADERS (for transactional) ────────────────
function buildRawEmailTransactional({ from, to, subject, htmlBody, textBody }) {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  const encodedSubject = /[^\x00-\x7F]/.test(subject) 
    ? `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`
    : subject;

  const rawEmail = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    textBody,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  return rawEmail;
}

// ─── SEND ONE EMAIL ───────────────────────────────────────────────────────────
export async function sendEmail({ 
  toEmail, 
  toName, 
  subject, 
  htmlBody, 
  textBody, 
  listId, 
  transactional = false,
  campaignId = null,
  contactId = null 
}) {
  const fromAddress = `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`;
  const toAddress = toName ? `${toName} <${toEmail}>` : toEmail;

  let rawEmail;

  if (transactional) {
    rawEmail = buildRawEmailTransactional({
      from: fromAddress,
      to: toAddress,
      subject,
      htmlBody,
      textBody,
    });
  } else {
    const unsubUrl = `${process.env.BASE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}&list=${listId}`;

    const unsubFooter = `<div style="text-align:center;padding:24px;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#555555;border-top:1px solid #222222;margin-top:32px;">
  <a href="${unsubUrl}" style="color:#888888;text-decoration:underline;">Unsubscribe</a>
  &nbsp;&middot;&nbsp;
  Big Poppa Code
</div>`;

    let htmlWithUnsub = htmlBody.includes('</body>')
      ? htmlBody.replace('</body>', `${unsubFooter}</body>`)
      : htmlBody + unsubFooter;

    // ─── ADD TRACKING (if campaignId provided) ─────────────────────────────
    if (campaignId && contactId) {
      // Rewrite links to tracking URLs
      htmlWithUnsub = await rewriteLinksWithTracking(htmlWithUnsub, campaignId, contactId);
      
      // Generate and save open tracking token
      const openToken = crypto.randomUUID();
      await TrackingToken.create({
        token: openToken,
        campaignId,
        contactId,
        tokenType: 'open',
      });
      
      // Inject tracking pixel
      htmlWithUnsub = injectTrackingPixel(htmlWithUnsub, openToken);
    }

    const textWithUnsub = `${textBody}\n\n---\nTo unsubscribe: ${unsubUrl}`;

    rawEmail = buildRawEmail({
      from: fromAddress,
      to: toAddress,
      subject,
      htmlBody: htmlWithUnsub,
      textBody: textWithUnsub,
      unsubUrl,
    });
  }

  const command = new SendRawEmailCommand({
    RawMessage: {
      Data: Buffer.from(rawEmail),
    },
  });

  return sesClient.send(command);
}

// ─── SES RATE LIMITS ─────────────────────────────────────────────────────────
// Configure based on your SES account limits
const SES_RATE_LIMIT = {
  perSecond: 14,      // Max emails per second (your account limit)
  perDay: 50000,      // Max emails per day (your account limit)
  safetyMargin: 0.85, // Use 85% of limit to avoid throttling
};

// ─── RUN A CAMPAIGN FROM MONGODB ─────────────────────────────────────────────
export async function sendCampaign({ listName, subject, buildEmail, campaignName, templateName = 'unknown' }) {
  await connectDB();

  const list = await List.findOne({ name: new RegExp(`^${listName}$`, 'i') });
  if (!list) throw new Error(`List not found: "${listName}"`);

  const contacts = await Contact.find({ listId: list._id, subscribed: true });

  // Check daily limit
  if (contacts.length > SES_RATE_LIMIT.perDay) {
    console.error(`\n❌  ABORT: List has ${contacts.length.toLocaleString()} contacts but daily limit is ${SES_RATE_LIMIT.perDay.toLocaleString()}`);
    console.error(`   Split the list or send over multiple days.\n`);
    process.exit(1);
  }

  // ─── CREATE CAMPAIGN DOCUMENT ─────────────────────────────────────────────
  const campaign = await Campaign.create({
    name: campaignName || subject,
    subject,
    listId: list._id,
    templateName,
    sentAt: new Date(),
    totalSent: 0,
    totalFailed: 0,
  });

  console.log(`📌  Campaign ID: ${campaign._id}`);

  // Calculate optimal batch settings (stay under rate limit with safety margin)
  const targetRate = Math.floor(SES_RATE_LIMIT.perSecond * SES_RATE_LIMIT.safetyMargin); // ~11-12/sec
  const BATCH_SIZE = targetRate;
  const DELAY_MS = 1000; // 1 second between batches

  // Estimate time
  const estimatedSeconds = Math.ceil(contacts.length / targetRate);
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

  console.log(`\n🚀  Campaign: "${campaignName || subject}"`);
  console.log(`📋  List: "${list.name}"`);
  console.log(`📬  Subscribed contacts: ${contacts.length.toLocaleString()}`);
  console.log(`⚡  Rate: ~${targetRate} emails/sec (limit: ${SES_RATE_LIMIT.perSecond}/sec)`);
  console.log(`⏱️   Estimated time: ~${estimatedMinutes} minutes\n`);

  let sent = 0, failed = 0;
  const errors = [];

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (contact) => {
      try {
        const { html, text } = await buildEmail({
          firstName: contact.firstName,
          email:     contact.email,
          contact,
        });

        await sendEmail({
          toEmail:  contact.email,
          toName:   contact.firstName,
          subject,
          htmlBody: html,
          textBody: text,
          listId:   list._id.toString(),
          campaignId: campaign._id,  // ← Pass campaign ID for tracking
          contactId: contact._id,     // ← Pass contact ID for tracking
        });

        sent++;
        console.log(`  ✅ [${sent}/${contacts.length}] ${contact.email}`);
      } catch (err) {
        failed++;
        errors.push({ email: contact.email, error: err.message });
        console.error(`  ❌ Failed: ${contact.email} — ${err.message}`);
      }
    }));

    if (i + BATCH_SIZE < contacts.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // ─── UPDATE CAMPAIGN STATS ────────────────────────────────────────────────
  await Campaign.findByIdAndUpdate(campaign._id, {
    totalSent: sent,
    totalFailed: failed,
  });

  console.log(`\n📊  Done: ${sent} sent, ${failed} failed`);
  console.log(`📌  Campaign stats saved to database (ID: ${campaign._id})`);
  
  if (errors.length) {
    console.log('\n⚠️   Failed addresses:');
    errors.forEach(({ email, error }) => console.log(`     - ${email}: ${error}`));
  }

  await mongoose.disconnect();
}
