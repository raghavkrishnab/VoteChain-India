import { Router } from 'express';

import { auth } from '../middleware/auth.js';
import VoteTransaction from '../models/VoteTransaction.js';

const r = Router();
const withElection = (query) => query.populate('electionId', 'title chainElectionId');

r.get('/', auth, async (req, res) => {
  res.json({ audit: await withElection(VoteTransaction.find().sort({ createdAt: -1 }).limit(200)) });
});

r.get('/:transactionHash', auth, async (req, res) => {
  const entry = await withElection(VoteTransaction.findOne({ transactionHash: String(req.params.transactionHash).toLowerCase() }));
  if (!entry) return res.status(404).json({ message: 'Transaction not found' });
  res.json({ audit: entry });
});

export default r;
