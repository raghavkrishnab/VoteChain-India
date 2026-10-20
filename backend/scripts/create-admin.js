import { connectDB } from '../src/config/db.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { ethers } from 'ethers';

import User from '../src/models/User.js';

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_WALLET_ADDRESS } = process.env;

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_WALLET_ADDRESS) {
  console.error('Set MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_WALLET_ADDRESS in backend/.env for this one-time seed.');
  process.exit(1);
}
if (!ethers.isAddress(ADMIN_WALLET_ADDRESS)) {
  console.error('ADMIN_WALLET_ADDRESS is not a valid address.');
  process.exit(1);
}

await connectDB();
await User.findOneAndUpdate(
  { email: ADMIN_EMAIL.toLowerCase() },
  {
    name: process.env.ADMIN_NAME || 'Demo Admin',
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
    role: 'admin',
    walletAddress: ADMIN_WALLET_ADDRESS.toLowerCase(),
    demoVoterId: 'DEMO-ADMIN',
  },
  { upsert: true, new: true }
);
console.log('Admin user created/updated.');
await mongoose.disconnect();
