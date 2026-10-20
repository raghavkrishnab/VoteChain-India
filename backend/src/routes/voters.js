import { Router } from 'express';

import { auth, adminOnly } from '../middleware/auth.js';
import User from '../models/User.js';
import { isRegisteredVoter } from '../services/chain.js';

const r = Router();

r.get('/', auth, adminOnly, async (req, res) => {
  const voters = await User.find({ role: 'voter' }).sort({ createdAt: -1 });
  // null when the chain can't be reached, so the list still loads.
  const onChain = await Promise.all(
    voters.map((v) => (v.walletAddress ? isRegisteredVoter(v.walletAddress).catch(() => null) : false))
  );
  res.json({ voters: voters.map((v, i) => ({ ...v.toSafeJSON(), onChainRegistered: onChain[i] })) });
});

// Admin decision on a voter. Only documentStatus can be changed here; approval
// requires a passed AI check and the wallet already registered on-chain, so
// the database never claims more than the contract enforces.
r.patch('/:id/approval', auth, adminOnly, async (req, res) => {
  const { decision } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: "decision must be 'approved' or 'rejected'" });
  }

  const voter = await User.findOne({ _id: req.params.id, role: 'voter' });
  if (!voter) return res.status(404).json({ message: 'Voter not found' });

  if (decision === 'approved') {
    if (voter.verificationStatus !== 'verified' || voter.eligibilityStatus !== 'eligible') {
      return res.status(409).json({ message: 'Voter has not passed AI face and age verification' });
    }
    if (!voter.walletAddress || !(await isRegisteredVoter(voter.walletAddress))) {
      return res.status(409).json({ message: 'Register the voter wallet on-chain before approving' });
    }
  }

  voter.documentStatus = decision;
  await voter.save();
  res.json({ user: voter.toSafeJSON() });
});

export default r;
