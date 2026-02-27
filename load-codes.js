// load-codes.js — Bulk load access codes from codes.json into MongoDB
// Run: node load-codes.js
// Safe to run multiple times — duplicates are silently skipped via upsert

import 'dotenv/config';
import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// AccessCode schema (must match server.js)
const AccessCodeSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true, trim: true },
  used:      { type: Boolean, default: false },
  usedAt:    { type: Date },
  usedBy:    { type: String },
  orderId:   { type: String },
  createdAt: { type: Date, default: Date.now },
});

const AccessCode = mongoose.model('AccessCode', AccessCodeSchema);

async function loadCodes() {
  console.log('\n🔑  Access Code Loader');
  console.log('━'.repeat(40));

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  // Read codes.json
  const codesPath = path.join(__dirname, 'codes.json');
  let codesJson;
  
  try {
    const fileContent = await readFile(codesPath, 'utf8');
    codesJson = JSON.parse(fileContent);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('\n❌  codes.json not found!');
      console.error('   Create a codes.json file in the project root with an array of code strings:');
      console.error('   ["CODE-001", "CODE-002", "CODE-003", ...]\n');
      await mongoose.disconnect();
      process.exit(1);
    }
    throw err;
  }

  if (!Array.isArray(codesJson)) {
    console.error('\n❌  codes.json must be a flat array of strings');
    console.error('   Example: ["CODE-001", "CODE-002", "CODE-003"]\n');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`📦  Found ${codesJson.length} codes in codes.json\n`);

  let loaded = 0;
  let skipped = 0;

  for (const code of codesJson) {
    if (typeof code !== 'string' || !code.trim()) {
      skipped++;
      continue;
    }

    try {
      const result = await AccessCode.findOneAndUpdate(
        { code: code.trim() },
        { 
          $setOnInsert: { 
            code: code.trim(),
            used: false,
            createdAt: new Date(),
          }
        },
        { upsert: true, new: true, rawResult: true }
      );

      if (result.lastErrorObject?.updatedExisting) {
        skipped++;
      } else {
        loaded++;
      }
    } catch (err) {
      // Handle duplicate key errors (shouldn't happen with upsert, but just in case)
      if (err.code === 11000) {
        skipped++;
      } else {
        console.error(`  ⚠️  Error loading code "${code}": ${err.message}`);
        skipped++;
      }
    }
  }

  // Get current stats
  const total = await AccessCode.countDocuments();
  const used = await AccessCode.countDocuments({ used: true });
  const available = total - used;

  console.log('━'.repeat(40));
  console.log(`✅  Loaded ${loaded} new codes`);
  console.log(`⏭️   Skipped ${skipped} duplicates\n`);
  console.log('📊  Database Status:');
  console.log(`    Total codes:     ${total}`);
  console.log(`    Used:            ${used}`);
  console.log(`    Available:       ${available}\n`);

  await mongoose.disconnect();
  console.log('✅  Done\n');
}

loadCodes().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
