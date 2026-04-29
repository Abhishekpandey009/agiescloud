#!/usr/bin/env node
require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');

async function usage() {
  console.log(`Usage:
  node scripts/reset-password.js --email user@example.com --password NewPass123 --unlock
  node scripts/reset-password.js --email user@example.com --token    # prints a reset token (does not change password)
`);
}

function parseArgs() {
  const args = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = raw[i+1] && !raw[i+1].startsWith('--') ? raw[i+1] : true;
      args[key] = val;
      if (val !== true) i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();
  if (!args.email) {
    await usage();
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email: args.email.toLowerCase() }).select('+password');
  if (!user) {
    console.error('User not found for email:', args.email);
    await disconnectDB();
    process.exit(2);
  }

  if (args.token) {
    const token = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    console.log('Password reset token (send this to user):', token);
    console.log('This token will be valid for 10 minutes. The stored hashed token is saved on the user document.');
    await disconnectDB();
    process.exit(0);
  }

  if (args.password) {
    // set new password (pre-save hook will hash it)
    user.password = args.password;
    // clear reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // optionally unlock account
    if (args.unlock) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }
    await user.save();
    console.log('Password updated for', args.email);
    if (args.unlock) console.log('Account unlocked');
    await disconnectDB();
    process.exit(0);
  }

  console.error('No action specified. Use --password or --token');
  await disconnectDB();
  process.exit(1);
}

main().catch(async (err) => {
  console.error('Error:', err);
  try { await disconnectDB(); } catch(e){}
  process.exit(1);
});
