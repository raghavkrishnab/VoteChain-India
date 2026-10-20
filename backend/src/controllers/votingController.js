import { ethers } from 'ethers';

import VoteTransaction from '../models/VoteTransaction.js';
import Election from '../models/Election.js';
import { verifyVoteTransaction } from '../services/chain.js';

// Records a vote only after confirming on-chain that this user's wallet cast it.
export async function record(req, res) {
  const { electionId, transactionHash } = req.body;
  if (!electionId || !ethers.isHexString(transactionHash, 32)) {
    return res.status(400).json({ message: 'electionId and a valid transactionHash are required' });
  }
  if (!req.user.walletAddress) return res.status(400).json({ message: 'Your account has no wallet' });

  const election = await Election.findById(electionId);
  if (!election) return res.status(404).json({ message: 'Election not found' });

  const existing = await VoteTransaction.findOne({ transactionHash: transactionHash.toLowerCase() });
  if (existing) return res.json({ transaction: existing });

  const { candidateIdentifier, blockNumber } = await verifyVoteTransaction(transactionHash, {
    voter: req.user.walletAddress,
    chainElectionId: election.chainElectionId,
  });

  const transaction = await VoteTransaction.create({
    electionId: election._id,
    walletAddress: req.user.walletAddress,
    candidateIdentifier,
    transactionHash,
    blockNumber,
  });
  res.status(201).json({ transaction });
}

export async function status(req, res) {
  const vote = await VoteTransaction.findOne({ electionId: req.params.electionId, walletAddress: req.user.walletAddress });
  res.json({ hasRecordedVote: !!vote, transaction: vote });
}
