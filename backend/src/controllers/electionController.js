import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import { env } from '../config/env.js';
import { ChainStatus, getElectionStatus, getResults } from '../services/chain.js';
import { httpError } from '../utils/httpError.js';

const str = (value) => (typeof value === 'string' ? value.trim() : '');

const positiveInt = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

async function findElection(id) {
  const election = await Election.findById(id);
  if (!election) throw httpError(404, 'Election not found');
  return election;
}

// Only elections that live on the currently configured contract are shown;
// records from an older deployment cannot be voted on or tallied.
export async function list(req, res) {
  res.json({ elections: await Election.find({ contractAddress: env.CONTRACT_ADDRESS }).sort({ createdAt: -1 }) });
}

export async function get(req, res) {
  res.json({ election: await findElection(req.params.id) });
}

// The admin's wallet calls Voting.createElection() first; this records the
// resulting on-chain id after confirming it exists and is still in setup.
export async function create(req, res) {
  const title = str(req.body.title);
  const chainElectionId = positiveInt(req.body.chainElectionId);
  if (!title || !chainElectionId) {
    return res.status(400).json({ message: 'Title and a positive chainElectionId are required' });
  }
  if ((await getElectionStatus(chainElectionId)) !== ChainStatus.Created) {
    return res.status(400).json({ message: 'That election id is not in setup state on-chain' });
  }

  const election = await Election.create({
    title,
    description: str(req.body.description),
    chainElectionId,
    contractAddress: env.CONTRACT_ADDRESS,
    chainId: env.CHAIN_ID,
    createdBy: req.user._id,
  });
  res.status(201).json({ election });
}

// Start/end are performed on-chain by the admin wallet; these endpoints sync
// the database from the chain rather than trusting the client.
async function syncStatus(req, res, expectedChainStatus, update) {
  const election = await findElection(req.params.id);
  const chainStatus = await getElectionStatus(election.chainElectionId);
  if (chainStatus !== expectedChainStatus) {
    return res.status(409).json({ message: 'On-chain election status does not match; send the transaction first' });
  }
  Object.assign(election, update);
  await election.save();
  res.json({ election });
}

export const start = (req, res) => syncStatus(req, res, ChainStatus.Active, { status: 'active', startTime: new Date() });

export const end = (req, res) => syncStatus(req, res, ChainStatus.Ended, { status: 'ended', endTime: new Date() });

export async function addCandidate(req, res) {
  const election = await findElection(req.params.id);
  const partyName = str(req.body.partyName);
  const name = str(req.body.name);
  const candidateIdentifier = positiveInt(req.body.candidateIdentifier);

  if (!partyName || !name || !candidateIdentifier) {
    return res.status(400).json({ message: 'Party name, candidate name and a positive candidate identifier are required' });
  }
  if (election.status !== 'draft') return res.status(409).json({ message: 'Candidates can only be added before the election starts' });

  const onChain = await getResults(election.chainElectionId);
  if (!onChain.candidates.some((c) => c.candidateIdentifier === candidateIdentifier)) {
    return res.status(409).json({ message: 'Candidate is not registered on-chain yet; send the transaction first' });
  }

  const candidate = await Candidate.create({
    electionId: election._id,
    partyName,
    name,
    partySymbol: str(req.body.partySymbol),
    description: str(req.body.description),
    candidateIdentifier,
  });
  res.status(201).json({ candidate });
}

export async function candidates(req, res) {
  res.json({ candidates: await Candidate.find({ electionId: req.params.id }).sort({ candidateIdentifier: 1 }) });
}

// Vote counts always come from the chain; the database only adds party details.
export async function results(req, res) {
  const election = await findElection(req.params.id);
  const [onChain, details] = await Promise.all([
    getResults(election.chainElectionId),
    Candidate.find({ electionId: election._id }),
  ]);
  const byId = new Map(details.map((c) => [c.candidateIdentifier, c]));

  res.json({
    election,
    totalVotes: onChain.candidates.reduce((sum, c) => sum + c.votes, 0),
    results: onChain.candidates.map((c) => ({
      ...c,
      partyName: byId.get(c.candidateIdentifier)?.partyName || '',
      partySymbol: byId.get(c.candidateIdentifier)?.partySymbol || '',
    })),
  });
}
