import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    partyName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    partySymbol: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    // Candidate id used by the contract; unique within an election.
    candidateIdentifier: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

schema.index({ electionId: 1, candidateIdentifier: 1 }, { unique: true });

export default mongoose.model('Candidate', schema);
