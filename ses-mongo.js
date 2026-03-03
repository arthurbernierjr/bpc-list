// ses-mongo.js — SES sender that reads from MongoDB + injects unsubscribe links
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import mongoose from 'mongoose';
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

export const List    = mongoose.models.List    || mongoose.model('List', ListSchema);
export const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

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
export async function sendEmail({ toEmail, toName, subject, htmlBody, textBody, listId, transactional = false }) {
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

    const htmlWithUnsub = htmlBody.includes('</body>')
      ? htmlBody.replace('</body>', `${unsubFooter}</body>`)
      : htmlBody + unsubFooter;

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
export async function sendCampaign({ listName, subject, buildEmail, campaignName }) {
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

  console.log(`\n📊  Done: ${sent} sent, ${failed} failed`);
  if (errors.length) {
    console.log('\n⚠️   Failed addresses:');
    errors.forEach(({ email, error }) => console.log(`     - ${email}: ${error}`));
  }

  await mongoose.disconnect();
}
