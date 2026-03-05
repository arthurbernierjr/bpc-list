// server.js — BPC List Manager
// Express + MongoDB + CSV Upload + Unsubscribe System + Auth + Email Preview + Square Webhook
// SECURITY: Admin routes are localhost-only. Production only exposes webhook + unsubscribe.

import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { render } from '@react-email/render';
import React from 'react';
import { sendEmail, connectDB as connectSES } from './ses-mongo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Security headers - allow inline scripts for localhost dashboard
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      frameSrc: ["'self'"],
    },
  },
}));

// Rate limiting for public webhook endpoint
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute (Square may retry)
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── LOCALHOST DETECTION ─────────────────────────────────────────────────────

function isLocalhost(req) {
  const host = req.hostname || req.host || '';
  const ip = req.ip || req.connection?.remoteAddress || '';
  
  const localhostHosts = ['localhost', '127.0.0.1', '::1'];
  const localhostIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  
  return localhostHosts.includes(host) || localhostIPs.includes(ip);
}

// Middleware: Block route entirely if not localhost
function localhostOnly(req, res, next) {
  if (isLocalhost(req)) {
    return next();
  }
  // In production, these routes don't exist
  return res.status(404).send('Not Found');
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

// Trust proxy for correct IP detection behind reverse proxy
app.set('trust proxy', true);

// Square webhook needs raw body for signature verification — MUST come before express.json()
app.use('/webhook/square', express.raw({ type: 'application/json' }));

app.use(express.json());

// Static files: Only serve public folder, but NOT index.html in production
app.use((req, res, next) => {
  // Block direct access to index.html in production
  if (req.path === '/' || req.path === '/index.html') {
    if (!isLocalhost(req)) {
      return res.status(404).send('Not Found');
    }
  }
  next();
}, express.static(path.join(__dirname, 'public')));

// ─── MONGODB MODELS ──────────────────────────────────────────────────────────

const AdminSchema = new mongoose.Schema({
  email:        { type: String, required: true, lowercase: true, trim: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt:    { type: Date, default: Date.now },
});

const ListSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  createdAt:   { type: Date, default: Date.now },
});

const ContactSchema = new mongoose.Schema({
  email:           { type: String, required: true, lowercase: true, trim: true },
  firstName:       { type: String, trim: true, default: 'Friend' },
  lastName:        { type: String, trim: true, default: '' },
  phone:           { type: String, trim: true, default: '' },
  source:          { type: String, trim: true, default: '' },
  listId:          { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  subscribed:      { type: Boolean, default: true },
  unsubscribedAt:  { type: Date },
  createdAt:       { type: Date, default: Date.now },
  meta:            { type: mongoose.Schema.Types.Mixed, default: {} },
});

ContactSchema.index({ email: 1, listId: 1 }, { unique: true });

const AccessCodeSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true, trim: true },
  used:      { type: Boolean, default: false },
  usedAt:    { type: Date },
  usedBy:    { type: String },
  orderId:   { type: String },
  createdAt: { type: Date, default: Date.now },
});

const CampaignSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  subject:      { type: String, required: true },
  listId:       { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  templateName: { type: String, required: true },
  sentAt:       { type: Date, default: Date.now },
  totalSent:    { type: Number, default: 0 },
  totalFailed:  { type: Number, default: 0 },
  createdAt:    { type: Date, default: Date.now },
});

const TrackingTokenSchema = new mongoose.Schema({
  token:      { type: String, required: true, unique: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  contactId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  tokenType:  { type: String, enum: ['open', 'click'], required: true },
  targetUrl:  { type: String }, // for click tokens only
  createdAt:  { type: Date, default: Date.now },
});

const EmailEventSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  contactId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  eventType:  { type: String, enum: ['open', 'click'], required: true },
  timestamp:  { type: Date, default: Date.now },
  url:        { type: String }, // for click events
  userAgent:  { type: String },
  ip:         { type: String },
});

EmailEventSchema.index({ campaignId: 1, contactId: 1, eventType: 1 });

const EmailPreviewSchema = new mongoose.Schema({
  token:        { type: String, required: true, unique: true, index: true },
  templateName: { type: String, required: true },
  sampleData:   { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt:    { type: Date, default: Date.now },
  expiresAt:    { type: Date, required: true },
});

const Admin         = mongoose.models.Admin         || mongoose.model('Admin', AdminSchema);
const List          = mongoose.models.List          || mongoose.model('List', ListSchema);
const Contact       = mongoose.models.Contact       || mongoose.model('Contact', ContactSchema);
const AccessCode    = mongoose.models.AccessCode    || mongoose.model('AccessCode', AccessCodeSchema);
const Campaign      = mongoose.models.Campaign      || mongoose.model('Campaign', CampaignSchema);
const TrackingToken = mongoose.models.TrackingToken || mongoose.model('TrackingToken', TrackingTokenSchema);
const EmailEvent    = mongoose.models.EmailEvent    || mongoose.model('EmailEvent', EmailEventSchema);
const EmailPreview  = mongoose.models.EmailPreview  || mongoose.model('EmailPreview', EmailPreviewSchema);

// ─── CONNECT TO MONGODB ───────────────────────────────────────────────────────

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅  Connected to MongoDB');

// ─── IMPORT EMAIL TEMPLATES ──────────────────────────────────────────────────

const templateRegistry = {
  conference: {
    name: 'Conference Email',
    subject: "You showed up. So here's everything I've got.",
    description: 'Follow-up for conference attendees',
    loader: async () => (await import('./emails/ConferenceEmail.jsx')).default,
    defaultProps: { firstName: 'Friend' },
    propTypes: {
      firstName: { type: 'text', label: 'First Name', placeholder: 'Friend' },
    },
  },
  community: {
    name: 'Community Email',
    subject: 'Love, Cancer, and AI Automation',
    description: 'Newsletter for main community list',
    loader: async () => (await import('./emails/CommunityEmail.jsx')).default,
    defaultProps: { firstName: 'Friend' },
    propTypes: {
      firstName: { type: 'text', label: 'First Name', placeholder: 'Friend' },
    },
  },
  accesscode: {
    name: 'Access Code Email',
    subject: "You're in. Here's your AI Plug Library access 🔑",
    description: 'Transactional email for library purchases',
    loader: async () => (await import('./emails/AccessCodeEmail.jsx')).default,
    defaultProps: { firstName: 'Friend', accessCode: 'DEMO123', sessionPurchase: false },
    propTypes: {
      firstName: { type: 'text', label: 'First Name', placeholder: 'Friend' },
      accessCode: { type: 'text', label: 'Access Code', placeholder: 'DEMO123' },
      sessionPurchase: { type: 'boolean', label: 'Session Purchase' },
    },
  },
  youtubevideo: {
    name: 'YouTube Video Email',
    subject: 'New Video from Big Poppa Code',
    description: 'Announcement for new YouTube videos',
    loader: async () => (await import('./emails/YouTubeVideoEmail.jsx')).default,
    defaultProps: {
      firstName: 'Friend',
      videoTitle: 'New Video on the Channel',
      videoUrl: 'https://youtube.com/@bigpoppacode',
      videoDescription: 'Check out my latest video on AI, automation, and building with code.',
      videoThumbnailUrl: 'https://list-manager.bigpoppacode.io/video-1.png',
    },
    propTypes: {
      firstName: { type: 'text', label: 'First Name', placeholder: 'Friend' },
      videoTitle: { type: 'text', label: 'Video Title', placeholder: 'New Video on the Channel' },
      videoUrl: { type: 'text', label: 'Video URL', placeholder: 'https://youtube.com/...' },
      videoDescription: { type: 'textarea', label: 'Video Description', placeholder: 'Video description...' },
      videoThumbnailUrl: { type: 'text', label: 'Thumbnail URL', placeholder: 'https://...' },
    },
  },
};

// Legacy templateMap for backward compatibility
const templateMap = Object.fromEntries(
  Object.entries(templateRegistry).map(([key, val]) => [key, val.loader])
);

// ─── JWT AUTH MIDDLEWARE (also requires localhost) ───────────────────────────

function authMiddleware(req, res, next) {
  // Double-check localhost even though routes use localhostOnly
  if (!isLocalhost(req)) {
    return res.status(404).send('Not Found');
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
}

// ─── AUTH ROUTES (LOCALHOST ONLY) ────────────────────────────────────────────

app.post('/api/auth/login', localhostOnly, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      token,
      admin: { email: admin.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/verify', localhostOnly, authMiddleware, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

// ─── EMAIL TEMPLATE ROUTES (LOCALHOST ONLY) ──────────────────────────────────

// Get list of available templates with metadata
app.get('/api/templates', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const templates = Object.entries(templateRegistry).map(([key, template]) => ({
      id: key,
      name: template.name,
      subject: template.subject,
      description: template.description,
      defaultProps: template.defaultProps,
      propTypes: template.propTypes,
    }));
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EMAIL PREVIEW ROUTES (LOCALHOST ONLY) ───────────────────────────────────

// GET preview with default props
app.get('/api/preview/:templateName', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const { templateName } = req.params;
    const templateInfo = templateRegistry[templateName.toLowerCase()];
    
    if (!templateInfo) {
      return res.status(404).json({ error: `Template not found: ${templateName}` });
    }

    const Template = await templateInfo.loader();
    const props = { ...templateInfo.defaultProps };
    const html = await render(React.createElement(Template, props));
    
    res.type('text/html').send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST preview with custom props (for live editing)
app.post('/api/preview/:templateName', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const { templateName } = req.params;
    const templateInfo = templateRegistry[templateName.toLowerCase()];
    
    if (!templateInfo) {
      return res.status(404).json({ error: `Template not found: ${templateName}` });
    }

    const Template = await templateInfo.loader();
    const props = { ...templateInfo.defaultProps, ...req.body };
    const html = await render(React.createElement(Template, props));
    
    res.type('text/html').send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/test-send/:templateName', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const { templateName } = req.params;
    const templateInfo = templateRegistry[templateName.toLowerCase()];
    
    if (!templateInfo) {
      return res.status(404).json({ error: `Template not found: ${templateName}` });
    }

    const testEmails = (process.env.TEST_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    
    if (!testEmails.length) {
      return res.status(400).json({ error: 'No test emails configured in TEST_EMAILS env var' });
    }

    const Template = await templateInfo.loader();
    const props = { ...templateInfo.defaultProps, ...req.body };
    const html = await render(React.createElement(Template, props));
    const text = await render(React.createElement(Template, props), { plainText: true });

    const subject = `[TEST] ${templateInfo.subject}`;

    const results = await Promise.allSettled(
      testEmails.map(email => 
        sendEmail({
          toEmail: email,
          toName: props.firstName || 'Friend',
          subject,
          htmlBody: html,
          textBody: text,
          listId: 'test',
          transactional: templateName.toLowerCase() === 'accesscode',
        })
      )
    );

    const summary = results.map((result, i) => ({
      email: testEmails[i],
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason.message : null,
    }));

    res.json({ 
      success: true, 
      sent: summary.filter(s => s.success).length,
      failed: summary.filter(s => !s.success).length,
      results: summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SQUARE WEBHOOK (PUBLIC — must be accessible from Square servers) ────────

app.post('/webhook/square', webhookLimiter, async (req, res) => {
  try {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    
    if (!signatureKey) {
      console.error('[Square Webhook] SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
      return res.status(500).send('Webhook not configured');
    }

    // Verify signature using HMAC-SHA256
    const notificationUrl = `${process.env.BASE_URL}/webhook/square`;
    const payload = req.body.toString('utf8');
    const hmac = crypto.createHmac('sha256', signatureKey);
    hmac.update(notificationUrl + payload);
    const expectedSignature = hmac.digest('base64');

    if (signature !== expectedSignature) {
      console.error('[Square Webhook] Invalid signature');
      return res.status(403).send('Invalid signature');
    }

    const event = JSON.parse(payload);
    
    // Only process payment.completed events
    if (event.type !== 'payment.completed') {
      console.log(`[Square Webhook] Ignoring event type: ${event.type}`);
      return res.status(200).send('OK');
    }

    const payment = event.data?.object?.payment;
    if (!payment) {
      console.error('[Square Webhook] No payment object in event');
      return res.status(200).send('OK');
    }

    const buyerEmail = payment.buyer_email_address;
    const amountCents = payment.amount_money?.amount;
    const orderId = payment.order_id;

    console.log(`[Square Webhook] Payment received: ${buyerEmail}, $${amountCents / 100}, order: ${orderId}`);

    // Verify payment amount is $197.00 (19700 cents) - launch price until March 9, 2026
    if (amountCents !== 19700) {
      console.log(`[Square Webhook] Payment amount ${amountCents} is not $197.00 (19700 cents), ignoring`);
      return res.status(200).send('OK');
    }

    if (!buyerEmail) {
      console.error('[Square Webhook] No buyer email in payment');
      return res.status(200).send('OK');
    }

    // Atomically find and mark one unused access code
    const accessCode = await AccessCode.findOneAndUpdate(
      { used: false },
      { 
        $set: { 
          used: true, 
          usedAt: new Date(), 
          usedBy: buyerEmail,
          orderId: orderId || null,
        }
      },
      { new: true }
    );

    if (!accessCode) {
      console.error('[Square Webhook] CRITICAL: No unused access codes remaining!');
      
      // Send alert email to admin
      try {
        await sendEmail({
          toEmail: process.env.FROM_EMAIL,
          toName: 'Big Poppa Code',
          subject: 'URGENT: AI Plug Library — No access codes remaining',
          htmlBody: `<html><body style="background:#080808;color:#fff;font-family:sans-serif;padding:40px;"><h1 style="color:#ff4444;">⚠️ No Access Codes Remaining</h1><p>A payment was received from <strong>${buyerEmail}</strong> but there are no unused access codes in the database.</p><p>Order ID: ${orderId || 'N/A'}</p><p>Please add more codes immediately and manually fulfill this order.</p></body></html>`,
          textBody: `URGENT: No access codes remaining!\n\nPayment from: ${buyerEmail}\nOrder ID: ${orderId || 'N/A'}\n\nPlease add more codes and manually fulfill this order.`,
          transactional: true,
        });
      } catch (alertErr) {
        console.error('[Square Webhook] Failed to send alert email:', alertErr.message);
      }
      
      return res.status(200).send('OK');
    }

    console.log(`[Square Webhook] Assigned code ${accessCode.code} to ${buyerEmail}`);

    // Send fulfillment email
    try {
      const AccessCodeEmail = (await import('./emails/AccessCodeEmail.jsx')).default;
      const firstName = buyerEmail.split('@')[0].split(/[._-]/)[0];
      const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

      const html = await render(React.createElement(AccessCodeEmail, { 
        firstName: capitalizedName,
        accessCode: accessCode.code,
        sessionPurchase: false,
      }));
      const text = await render(React.createElement(AccessCodeEmail, { 
        firstName: capitalizedName,
        accessCode: accessCode.code,
        sessionPurchase: false,
      }), { plainText: true });

      await sendEmail({
        toEmail: buyerEmail,
        toName: capitalizedName,
        subject: 'You\'re in. Here\'s your AI Plug Library access 🔑',
        htmlBody: html,
        textBody: text,
        transactional: true,
      });

      console.log(`[Square Webhook] Fulfillment email sent to ${buyerEmail}`);
    } catch (emailErr) {
      console.error('[Square Webhook] Failed to send fulfillment email:', emailErr.message);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[Square Webhook] Error:', err.message);
    res.status(200).send('OK');
  }
});

// ─── PROTECTED API ROUTES (LOCALHOST ONLY) ───────────────────────────────────

app.get('/api/lists', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const lists = await List.find().sort({ createdAt: -1 });
    const listsWithCounts = await Promise.all(lists.map(async (list) => {
      const total        = await Contact.countDocuments({ listId: list._id });
      const subscribed   = await Contact.countDocuments({ listId: list._id, subscribed: true });
      const unsubscribed = total - subscribed;
      return { ...list.toObject(), total, subscribed, unsubscribed };
    }));
    res.json(listsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lists', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'List name is required' });
    const list = await List.create({ name: name.trim(), description: description?.trim() });
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/lists/:id', localhostOnly, authMiddleware, async (req, res) => {
  try {
    await List.findByIdAndDelete(req.params.id);
    await Contact.deleteMany({ listId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lists/:id/upload', localhostOnly, authMiddleware, upload.single('csv'), async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (!req.file)  return res.status(400).json({ error: 'No CSV file provided' });

    const records = await new Promise((resolve, reject) => {
      const rows = [];
      Readable.from(req.file.buffer)
        .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', reject);
    });

    let added = 0, updated = 0, skipped = 0;

    for (const row of records) {
      const email = (
        row.email || row.Email || row.EMAIL || ''
      ).toLowerCase().trim();

      const firstName = (
        row['first name'] || row['First Name'] || row.first_name || 
        row.firstName || row.firstname || row.name || row.Name || 'Friend'
      ).trim();

      const lastName = (
        row['last name'] || row['Last Name'] || row.last_name || 
        row.lastName || row.lastname || ''
      ).trim();

      const phone = String(
        row['phone number'] || row['Phone Number'] || row.phone_number ||
        row.Phone || row.phone || row.PHONE || ''
      ).trim();

      const source = (
        row.source || row.Source || row.SOURCE || 
        row['Lead Source'] || row.lead_source || ''
      ).trim();

      if (!email || !email.includes('@')) { skipped++; continue; }

      const knownFields = [
        'email', 'Email', 'EMAIL',
        'first name', 'First Name', 'first_name', 'firstName', 'firstname', 'name', 'Name',
        'last name', 'Last Name', 'last_name', 'lastName', 'lastname',
        'phone number', 'Phone Number', 'phone_number', 'Phone', 'phone', 'PHONE',
        'source', 'Source', 'SOURCE', 'Lead Source', 'lead_source'
      ];
      const meta = {};
      for (const [key, value] of Object.entries(row)) {
        if (!knownFields.includes(key) && value) {
          meta[key] = value;
        }
      }

      const result = await Contact.findOneAndUpdate(
        { email, listId: list._id },
        { $set: { firstName, lastName, phone, source, meta, subscribed: true } },
        { upsert: true, new: true }
      );

      if (result.createdAt?.getTime() === result.updatedAt?.getTime()) added++;
      else updated++;
    }

    res.json({
      success: true,
      message: `Import complete`,
      added, updated, skipped,
      total: records.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lists/:id/contacts', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const filter = req.query.subscribed === 'false'
      ? { listId: req.params.id, subscribed: false }
      : { listId: req.params.id };

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Contact.countDocuments(filter),
    ]);

    res.json({ contacts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contacts/:id', localhostOnly, authMiddleware, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ACCESS CODE STATS (LOCALHOST ONLY) ──────────────────────────────────────

app.get('/api/access-codes/stats', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const total = await AccessCode.countDocuments();
    const used = await AccessCode.countDocuments({ used: true });
    const available = total - used;
    res.json({ total, used, available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CAMPAIGN & PREVIEW ADMIN ROUTES (LOCALHOST ONLY) ────────────────────────

// Create shareable email preview link
app.post('/api/preview/create', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const { templateName, sampleData } = req.body;
    const templateInfo = templateRegistry[templateName?.toLowerCase()];
    
    if (!templateName || !templateInfo) {
      return res.status(400).json({ error: 'Invalid template name' });
    }
    
    // Generate unique token
    const token = crypto.randomUUID();
    
    // Create preview with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Merge default props with provided sample data
    const mergedData = { ...templateInfo.defaultProps, ...sampleData };
    
    await EmailPreview.create({
      token,
      templateName: templateName.toLowerCase(),
      sampleData: mergedData,
      expiresAt,
    });
    
    const previewUrl = `${process.env.BASE_URL}/preview/${token}`;
    
    res.json({ success: true, previewUrl, expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all campaigns with stats
app.get('/api/campaigns', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ sentAt: -1 }).populate('listId', 'name');
    
    // Calculate stats for each campaign
    const campaignsWithStats = await Promise.all(campaigns.map(async (campaign) => {
      // Get unique opens
      const uniqueOpens = await EmailEvent.distinct('contactId', {
        campaignId: campaign._id,
        eventType: 'open',
      });
      
      // Get unique clicks
      const uniqueClicks = await EmailEvent.distinct('contactId', {
        campaignId: campaign._id,
        eventType: 'click',
      });
      
      const openRate = campaign.totalSent > 0 
        ? ((uniqueOpens.length / campaign.totalSent) * 100).toFixed(1)
        : '0.0';
      
      const clickRate = campaign.totalSent > 0
        ? ((uniqueClicks.length / campaign.totalSent) * 100).toFixed(1)
        : '0.0';
      
      const clickToOpenRate = uniqueOpens.length > 0
        ? ((uniqueClicks.length / uniqueOpens.length) * 100).toFixed(1)
        : '0.0';
      
      return {
        _id: campaign._id,
        name: campaign.name,
        subject: campaign.subject,
        listName: campaign.listId?.name || 'Unknown',
        templateName: campaign.templateName,
        sentAt: campaign.sentAt,
        totalSent: campaign.totalSent,
        totalFailed: campaign.totalFailed,
        uniqueOpens: uniqueOpens.length,
        uniqueClicks: uniqueClicks.length,
        openRate,
        clickRate,
        clickToOpenRate,
      };
    }));
    
    res.json(campaignsWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get detailed stats for a specific campaign
app.get('/api/campaigns/:id/stats', localhostOnly, authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('listId', 'name');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Get all events for this campaign
    const events = await EmailEvent.find({ campaignId: campaign._id })
      .populate('contactId', 'email firstName lastName')
      .sort({ timestamp: -1 });
    
    // Group events by contact
    const contactStats = {};
    
    events.forEach(event => {
      const contactId = event.contactId._id.toString();
      
      if (!contactStats[contactId]) {
        contactStats[contactId] = {
          email: event.contactId.email,
          firstName: event.contactId.firstName,
          lastName: event.contactId.lastName,
          opened: false,
          openedAt: null,
          clicked: false,
          clickedAt: null,
          clickedUrls: [],
        };
      }
      
      if (event.eventType === 'open' && !contactStats[contactId].opened) {
        contactStats[contactId].opened = true;
        contactStats[contactId].openedAt = event.timestamp;
      }
      
      if (event.eventType === 'click') {
        contactStats[contactId].clicked = true;
        if (!contactStats[contactId].clickedAt) {
          contactStats[contactId].clickedAt = event.timestamp;
        }
        if (event.url && !contactStats[contactId].clickedUrls.includes(event.url)) {
          contactStats[contactId].clickedUrls.push(event.url);
        }
      }
    });
    
    res.json({
      campaign: {
        _id: campaign._id,
        name: campaign.name,
        subject: campaign.subject,
        listName: campaign.listId?.name || 'Unknown',
        sentAt: campaign.sentAt,
        totalSent: campaign.totalSent,
        totalFailed: campaign.totalFailed,
      },
      contactStats: Object.values(contactStats),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EMAIL TRACKING ROUTES (PUBLIC — must be accessible from email clients) ──

// Track email opens (1x1 transparent pixel)
app.get('/track/open/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find tracking token
    const trackingToken = await TrackingToken.findOne({ token, tokenType: 'open' });
    
    if (trackingToken) {
      // Log the open event (deduplication handled by unique index query)
      await EmailEvent.findOneAndUpdate(
        { 
          campaignId: trackingToken.campaignId, 
          contactId: trackingToken.contactId, 
          eventType: 'open' 
        },
        {
          $setOnInsert: {
            campaignId: trackingToken.campaignId,
            contactId: trackingToken.contactId,
            eventType: 'open',
            timestamp: new Date(),
            userAgent: req.get('user-agent') || '',
            ip: req.ip || '',
          }
        },
        { upsert: true }
      );
    }
    
    // Return 1x1 transparent GIF (always, even if token not found - don't leak info)
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': gif.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    });
    res.end(gif);
  } catch (err) {
    // Always return GIF even on error - don't leak info
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': gif.length,
    });
    res.end(gif);
  }
});

// Track link clicks and redirect
app.get('/track/click/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find tracking token
    const trackingToken = await TrackingToken.findOne({ token, tokenType: 'click' });
    
    if (!trackingToken || !trackingToken.targetUrl) {
      return res.status(404).send('Link not found');
    }
    
    // Log the click event
    await EmailEvent.create({
      campaignId: trackingToken.campaignId,
      contactId: trackingToken.contactId,
      eventType: 'click',
      url: trackingToken.targetUrl,
      timestamp: new Date(),
      userAgent: req.get('user-agent') || '',
      ip: req.ip || '',
    });
    
    // Redirect to original URL
    res.redirect(302, trackingToken.targetUrl);
  } catch (err) {
    res.status(500).send('Error processing link');
  }
});

// Public email preview (shareable links with token)
app.get('/preview/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find preview token
    const preview = await EmailPreview.findOne({ token });
    
    if (!preview) {
      return res.status(404).send('Preview not found');
    }
    
    // Check if expired
    if (preview.expiresAt < new Date()) {
      return res.status(410).send('Preview link expired');
    }
    
    // Render email template with sample data
    const templateInfo = templateRegistry[preview.templateName];
    if (!templateInfo) {
      return res.status(404).send('Template not found');
    }
    
    const Template = await templateInfo.loader();
    const html = await render(React.createElement(Template, preview.sampleData));
    
    res.send(html);
  } catch (err) {
    res.status(500).send('Error rendering preview');
  }
});

// ─── UNSUBSCRIBE ROUTES (PUBLIC — must be accessible from email links) ───────

app.get('/unsubscribe', async (req, res) => {
  const { email, list } = req.query;
  res.sendFile(path.join(__dirname, 'public', 'unsubscribe.html'));
});

app.post('/unsubscribe', async (req, res) => {
  try {
    const { email, listId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const query = listId
      ? { email: email.toLowerCase(), listId }
      : { email: email.toLowerCase() };

    const result = await Contact.updateMany(
      query,
      { $set: { subscribed: false, unsubscribedAt: new Date() } }
    );

    res.json({
      success: true,
      message: `${email} has been unsubscribed`,
      updated: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/unsubscribe/oneclick', express.urlencoded({ extended: true }), async (req, res) => {
  const email  = req.body['List-Unsubscribe'];
  const listId = req.body.listId;
  if (email) {
    await Contact.updateMany(
      { email: email.toLowerCase(), ...(listId ? { listId } : {}) },
      { $set: { subscribed: false, unsubscribedAt: new Date() } }
    );
  }
  res.status(200).send('OK');
});

// ─── START ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀  BPC List Manager running at http://localhost:${PORT}`);
  console.log(`\n🔒  SECURITY MODE:`);
  console.log(`    • Admin dashboard: localhost only`);
  console.log(`    • All /api/* routes: localhost only`);
  console.log(`    • Square webhook: public (signature verified)`);
  console.log(`    • Unsubscribe: public`);
  console.log(`\n📋  Dashboard: http://localhost:${PORT}`);
  console.log(`🔗  Unsubscribe endpoint: ${process.env.BASE_URL}/unsubscribe`);
  console.log(`📧  Square webhook: ${process.env.BASE_URL}/webhook/square\n`);
});

export { Admin, List, Contact, AccessCode };
