import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: { type: String, enum: ['draft', 'active', 'ended'], default: 'draft' },
    // Election id assigned by Voting.createElection(); unique per contract.
    chainElectionId: { type: Number, required: true, min: 1 },
    contractAddress: { type: String, required: true, lowercase: true },
    chainId: { type: Number, default: 11155111 },
    startTime: Date,
    endTime: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

schema.index({ contractAddress: 1, chainElectionId: 1 }, { unique: true });

export default mongoose.model('Election', schema);
