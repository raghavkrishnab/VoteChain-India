import mongoose from 'mongoose';

// Off-chain index of votes; every record is verified against the chain before it is stored.
const schema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    walletAddress: { type: String, required: true, lowercase: true },
    candidateIdentifier: { type: Number, required: true },
    transactionHash: { type: String, required: true, unique: true, lowercase: true },
    blockNumber: { type: Number, required: true },
    status: { type: String, enum: ['confirmed'], default: 'confirmed' },
  },
  { timestamps: true }
);

schema.index({ electionId: 1, walletAddress: 1 }, { unique: true });

export default mongoose.model('VoteTransaction', schema);
