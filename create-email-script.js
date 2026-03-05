#!/usr/bin/env node
// create-email-script.js — CLI tool to generate email campaign scripts
// Usage: node create-email-script.js -template conference -list "NYNY Conference Leads" -name nyny-followup

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── PARSE CLI ARGS ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : null;
};

const template = getArg('-template') || getArg('--template');
const listName = getArg('-list') || getArg('--list');
const scriptName = getArg('-name') || getArg('--name');

// ─── DISCOVER AVAILABLE TEMPLATES ────────────────────────────────────────────

const emailsDir = path.join(__dirname, 'emails');
const availableTemplates = fs.readdirSync(emailsDir)
  .filter(file => file.endsWith('.jsx'))
  .map(file => file.replace('.jsx', ''));

// ─── VALIDATE INPUTS ──────────────────────────────────────────────────────────

if (!template || !listName || !scriptName) {
  console.error(`
❌ Missing required arguments

Usage:
  node create-email-script.js -template <template> -list <list-name> -name <script-name>

Arguments:
  -template    Email template name (without .jsx extension)
  -list        List name (must match dashboard exactly)
  -name        Script name (lowercase-with-dashes)

Available templates:
  ${availableTemplates.join(', ')}

Example:
  node create-email-script.js -template ConferenceEmail -list "NYNY Conference Leads" -name nyny-followup

This will create:
  ✅ send-nyny-followup.js
  ✅ npm script: "send:nyny-followup"
  `);
  process.exit(1);
}

// Remove .jsx if user accidentally included it
const templateName = template.replace('.jsx', '');

// Check if template exists (case-insensitive)
const templateMatch = availableTemplates.find(t => t.toLowerCase() === templateName.toLowerCase());

if (!templateMatch) {
  console.error(`\n❌ Template not found: "${templateName}"\n`);
  console.error(`Available templates in emails/ directory:\n`);
  availableTemplates.forEach(t => console.error(`  - ${t}`));
  console.error('');
  process.exit(1);
}

// Validate script name (lowercase, dashes only)
if (!/^[a-z0-9-]+$/.test(scriptName)) {
  console.error(`\n❌ Invalid script name: "${scriptName}"\n`);
  console.error(`Script name must be lowercase with dashes only (e.g., "nyny-followup")\n`);
  process.exit(1);
}

// ─── GENERATE SCRIPT FILE ─────────────────────────────────────────────────────

const fileName = `send-${scriptName}.js`;
const filePath = path.join(__dirname, fileName);

// Check if file already exists
if (fs.existsSync(filePath)) {
  console.error(`\n❌ File already exists: ${fileName}\n`);
  console.error(`Delete it first or choose a different name.\n`);
  process.exit(1);
}

// Use the matched template name (correct case)
const component = templateMatch;

// Generate templateName for tracking (lowercase, remove "Email" suffix if present)
const trackingTemplateName = component.replace(/Email$/i, '').toLowerCase();

// Default subject based on common patterns
const defaultSubject = `Email from Big Poppa Code`;

const scriptContent = `// ${fileName} — Email campaign script
// Generated: ${new Date().toISOString()}
// Run: npm run send:${scriptName}

import { render } from '@react-email/render';
import React from 'react';
import ${component} from './emails/${component}.jsx';
import { sendCampaign } from './ses-mongo.js';

await sendCampaign({
  listName:     '${listName}',
  campaignName: '${scriptName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}',
  subject:      '${defaultSubject}',
  templateName: '${trackingTemplateName}',

  async buildEmail({ firstName, contact }) {
    // Customize personalization here if needed
    const name = firstName !== 'Friend' 
      ? firstName 
      : (contact?.meta?.['First Name'] || contact?.meta?.['first name'] || 'Friend');
    
    return {
      html: await render(React.createElement(${component}, { firstName: name })),
      text: await render(React.createElement(${component}, { firstName: name }), { plainText: true }),
    };
  },
});
`;

// Write the script file
fs.writeFileSync(filePath, scriptContent, 'utf8');
console.log(`✅ Created: ${fileName}`);

// ─── UPDATE PACKAGE.JSON ──────────────────────────────────────────────────────

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add npm script
const npmScriptKey = `send:${scriptName}`;
const npmScriptValue = `node ${fileName}`;

if (!packageJson.scripts) {
  packageJson.scripts = {};
}

if (packageJson.scripts[npmScriptKey]) {
  console.warn(`⚠️  npm script "${npmScriptKey}" already exists in package.json (overwriting)`);
}

packageJson.scripts[npmScriptKey] = npmScriptValue;

// Write back to package.json with nice formatting
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
console.log(`✅ Added npm script: "send:${scriptName}"`);

// ─── SUCCESS ──────────────────────────────────────────────────────────────────

console.log(`\n🚀 Campaign script ready!\n`);
console.log(`Next steps:`);
console.log(`  1. Edit ${fileName} (customize subject, campaign name, etc.)`);
console.log(`  2. Verify list name matches dashboard exactly`);
console.log(`  3. Run: npm run send:${scriptName}\n`);
console.log(`Script details:`);
console.log(`  Template:     ${component}`);
console.log(`  List:         ${listName}`);
console.log(`  Tracking ID:  ${trackingTemplateName}`);
console.log(`  Subject:      ${defaultSubject}\n`);
