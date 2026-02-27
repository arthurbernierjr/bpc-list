// create-admin.js — One-time script to create the admin user
// Run: node create-admin.js
// 
// ⚠️  This script creates the single admin user from .env variables.
//     After running this once, DELETE THIS FILE for security.
//     The admin can only be created once — duplicates are rejected.

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// ─── VALIDATE ENV ─────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌  ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  process.exit(1);
}

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌  JWT_SECRET must be set in .env (at least 32 characters)');
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8) {
  console.error('❌  ADMIN_PASSWORD must be at least 8 characters');
  process.exit(1);
}

// ─── ADMIN SCHEMA ─────────────────────────────────────────────────────────────

const AdminSchema = new mongoose.Schema({
  email:        { type: String, required: true, lowercase: true, trim: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt:    { type: Date, default: Date.now },
});

const Admin = mongoose.model('Admin', AdminSchema);

// ─── CREATE ADMIN ─────────────────────────────────────────────────────────────

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      console.error('❌  Admin already exists! Only one admin is allowed.');
      console.log(`   Existing admin: ${existingAdmin.email}`);
      console.log('   If you need to reset, manually delete the admin from MongoDB.');
      process.exit(1);
    }

    // Hash password with bcrypt (12 rounds = secure + reasonable speed)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    // Create admin
    const admin = await Admin.create({
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
    });

    console.log('\n🎉  Admin user created successfully!\n');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Created: ${admin.createdAt.toISOString()}`);
    console.log('\n⚠️   IMPORTANT: Now delete this script for security!');
    console.log('   Run: rm create-admin.js\n');

  } catch (err) {
    if (err.code === 11000) {
      console.error('❌  Admin with this email already exists');
    } else {
      console.error('❌  Error:', err.message);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();



