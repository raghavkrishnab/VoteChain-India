import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['voter', 'admin'], default: 'voter' },
    walletAddress: { type: String, default: '', lowercase: true, trim: true },
    demoVoterId: { type: String, required: true, unique: true, trim: true },

    // Server-side paths of the files uploaded at registration.
    documentReference: { type: String, default: '' },
    faceReference: { type: String, default: '' },

    // Admin decision; approval also requires the wallet to be registered on-chain.
    documentStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // Result of the AI face match against `faceReference`.
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    // Result of the AI age check on `documentReference`.
    eligibilityStatus: { type: String, enum: ['pending', 'eligible', 'not_eligible'], default: 'pending' },

    nonce: { type: String, default: '' },
  },
  { timestamps: true }
);

// One account per wallet; accounts without a wallet are not constrained.
schema.index(
  { walletAddress: 1 },
  { unique: true, partialFilterExpression: { walletAddress: { $type: 'string', $gt: '' } } }
);

schema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    walletAddress: this.walletAddress,
    demoVoterId: this.demoVoterId,
    documentStatus: this.documentStatus,
    verificationStatus: this.verificationStatus,
    eligibilityStatus: this.eligibilityStatus,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', schema);
