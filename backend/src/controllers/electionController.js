import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import { env } from '../config/env.js';

// Get all elections.
export async function list(req, res) {
  res.json({
    elections: await Election.find().sort({ createdAt: -1 }),
  });
}

// Get one election.
export async function get(req, res) {
  const e = await Election.findById(req.params.id);

  if (!e) {
    return res.status(404).json({
      message: 'Election not found',
    });
  }

  res.json({
    election: e,
  });
}

// Create a new election.
export async function create(req, res) {
  const e = await Election.create({
    title: req.body.title,
    description: req.body.description,
    createdBy: req.user._id,
    contractAddress: env.CONTRACT_ADDRESS,
  });

  res.status(201).json({
    election: e,
  });
}

// Start an election.
export async function start(req, res) {
  const e = await Election.findByIdAndUpdate(
    req.params.id,
    {
      status: 'active',
      startTime: new Date(),
    },
    {
      new: true,
    }
  );

  if (!e) {
    return res.status(404).json({
      message: 'Election not found',
    });
  }

  res.json({
    election: e,
  });
}

// End an election.
export async function end(req, res) {
  const e = await Election.findByIdAndUpdate(
    req.params.id,
    {
      status: 'ended',
      endTime: new Date(),
    },
    {
      new: true,
    }
  );

  if (!e) {
    return res.status(404).json({
      message: 'Election not found',
    });
  }

  res.json({
    election: e,
  });
}

// Add a party/candidate to an election.
export async function addCandidate(req, res) {
  // Validate required party and candidate information.
  if (
    !req.body.partyName ||
    !req.body.name ||
    req.body.candidateIdentifier === undefined
  ) {
    return res.status(400).json({
      message: 'Party name, candidate name and candidate identifier are required',
    });
  }

  // Create the candidate/party record.
  const c = await Candidate.create({
    electionId: req.params.id,
    partyName: req.body.partyName,
    name: req.body.name,
    partySymbol: req.body.partySymbol || '',
    description: req.body.description || '',
    candidateIdentifier: Number(req.body.candidateIdentifier),
  });

  // Return the newly created candidate.
  res.status(201).json({
    candidate: c,
  });
}

// Get all candidates belonging to an election.
export async function candidates(req, res) {
  res.json({
    candidates: await Candidate.find({
      electionId: req.params.id,
    }).sort({
      candidateIdentifier: 1,
    }),
  });
}