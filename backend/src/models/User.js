import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['voter', 'admin'],
      default: 'voter',
    },

    walletAddress: {
      type: String,
      default: '',
    },

    demoVoterId: {
      type: String,
      required: true,
      unique: true,
    },

    // Path or identifier for the uploaded demo voter document
    documentReference: {
      type: String,
      default: '',
    },

    // Path or identifier for the registered reference face
    faceReference: {
      type: String,
      default: '',
    },

    // Document review status
    documentStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },

    eligibilityStatus: {
      type: String,
      enum: ['pending', 'eligible', 'not_eligible'],
      default: 'pending',
    },

    nonce: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('User', schema);
