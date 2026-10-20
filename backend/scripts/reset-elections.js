// Deletes elections, candidates and vote records (users are kept) and rebuilds
// indexes. Run after deploying a new contract, since old records cannot be used.
import 'dotenv/config';
import mongoose from 'mongoose';

import Election from '../src/models/Election.js';
import Candidate from '../src/models/Candidate.js';
import VoteTransaction from '../src/models/VoteTransaction.js';
import User from '../src/models/User.js';

if (!process.argv.includes('--yes')) {
  console.error('This permanently deletes all elections, candidates and vote records. Re-run with --yes to confirm.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
for (const model of [Election, Candidate, VoteTransaction]) {
  const { deletedCount } = await model.deleteMany({});
  console.log(`${model.modelName}: deleted ${deletedCount}`);
}
// Voters must be re-registered on the new contract, so their approval is reset too.
const { modifiedCount } = await User.updateMany({ role: 'voter', documentStatus: 'approved' }, { documentStatus: 'pending' });
console.log(`Voters reset to pending approval: ${modifiedCount}`);
for (const model of [Election, Candidate, VoteTransaction, User]) await model.syncIndexes();
console.log('Indexes synced.');
await mongoose.disconnect();
