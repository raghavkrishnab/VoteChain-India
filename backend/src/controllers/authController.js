import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ethers } from 'ethers';

import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { loginMessage, registrationMessage } from '../utils/messages.js';
import { DOCUMENT_TYPES, IMAGE_TYPES } from '../middleware/upload.js';
import { saveFile, deleteFile } from '../services/storage.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (value) => (typeof value === 'string' ? value.trim() : '');

function recoverSigner(message, signature) {
  try {
    return ethers.verifyMessage(message, signature).toLowerCase();
  } catch {
    return null;
  }
}

export async function register(req, res) {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const demoVoterId = str(req.body.demoVoterId);
  const walletAddress = str(req.body.walletAddress).toLowerCase();
  const signature = str(req.body.walletSignature);
  const documentFile = req.files?.document?.[0];
  const faceFile = req.files?.referenceFace?.[0];

  if (!name || !email || !password || !demoVoterId || !walletAddress) {
    return res.status(400).json({ message: 'Name, email, password, demo voter ID and wallet are required' });
  }
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Invalid email address' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  if (!ethers.isAddress(walletAddress)) return res.status(400).json({ message: 'Invalid wallet address' });
  if (recoverSigner(registrationMessage(walletAddress, email), signature) !== walletAddress) {
    return res.status(400).json({ message: 'Wallet signature is missing or does not match the wallet address' });
  }
  if (!documentFile || !faceFile) {
    return res.status(400).json({ message: 'Demo voter document and reference face are required' });
  }
  if (req.body.consent !== 'true') return res.status(400).json({ message: 'Consent is required' });

  const documentRef = await saveFile(documentFile.buffer, `document${DOCUMENT_TYPES[documentFile.mimetype]}`, documentFile.mimetype);
  const faceRef = await saveFile(faceFile.buffer, `reference-face${IMAGE_TYPES[faceFile.mimetype]}`, faceFile.mimetype);

  try {
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      demoVoterId,
      walletAddress,
      documentReference: documentRef,
      faceReference: faceRef,
    });
    res.status(201).json({ message: 'Registered', user: user.toSafeJSON() });
  } catch (e) {
    // Do not keep biometric files for an account that was never created.
    await Promise.allSettled([deleteFile(documentRef), deleteFile(faceRef)]);
    if (e.code === 11000) {
      return res.status(409).json({ message: 'Email, demo voter ID or wallet is already registered' });
    }
    throw e;
  }
}

export async function login(req, res) {
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = email && password ? await User.findOne({ email }) : null;

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: user.toSafeJSON() });
}

export async function nonce(req, res) {
  const walletAddress = str(req.body.walletAddress).toLowerCase();
  if (!ethers.isAddress(walletAddress)) return res.status(400).json({ message: 'Invalid wallet address' });

  const user = await User.findOne({ walletAddress });
  if (!user) return res.status(404).json({ message: 'Register this wallet first' });

  user.nonce = crypto.randomBytes(24).toString('hex');
  await user.save();
  res.json({ nonce: user.nonce });
}

export async function verifySignature(req, res) {
  const walletAddress = str(req.body.walletAddress).toLowerCase();
  const signature = str(req.body.signature);
  if (!ethers.isAddress(walletAddress) || !signature) {
    return res.status(400).json({ message: 'Wallet address and signature are required' });
  }

  const user = await User.findOne({ walletAddress });
  if (!user?.nonce) return res.status(400).json({ message: 'Nonce not found; request a new one' });

  const recovered = recoverSigner(loginMessage(user.nonce), signature);
  // Single-use nonce, consumed whether or not the signature matched.
  user.nonce = '';
  await user.save();
  if (recovered !== walletAddress) return res.status(401).json({ message: 'Signature does not match wallet' });

  res.json({ token: signToken(user), user: user.toSafeJSON() });
}

export function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}
