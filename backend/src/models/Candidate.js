import mongoose from 'mongoose';

const s = new mongoose.Schema(
  {
    // Election this candidate belongs to.
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true,
    },

    // Political party name.
    partyName: {
      type: String,
      required: true,
      trim: true,
    },

    // Candidate name.
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Party symbol or short symbol text.
    partySymbol: {
      type: String,
      default: '',
      trim: true,
    },

    // Candidate/party information shown to voters.
    description: {
      type: String,
      default: '',
    },

    // Numeric identifier used by the blockchain contract.
    candidateIdentifier: {
      type: Number,
      required: true,
    },

    // Candidate creation time.
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

export default mongoose.model('Candidate', s);