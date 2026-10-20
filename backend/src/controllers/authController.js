import bcrypt from 'bcrypt';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { ethers } from 'ethers';

import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

export async function register(req, res) {
  const {
    name,
    email,
    password,
    demoVoterId,
    walletAddress = '',
  } = req.body;

  const documentFile = req.files?.document?.[0];
  const referenceFaceFile = req.files?.referenceFace?.[0];

  if (!name || !email || !password || !demoVoterId) {
    return res.status(400).json({
      message: 'Required fields are missing',
    });
  }

  if (!documentFile || !referenceFaceFile) {
    return res.status(400).json({
      message: 'Demo voter document and reference face are required',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters',
    });
  }

  if (walletAddress && !ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      message: 'Invalid wallet address',
    });
  }

  try {
    const uploadDirectory = path.join(
      process.cwd(),
      'uploads',
      'registration'
    );

    await fs.mkdir(uploadDirectory, {
      recursive: true,
    });

    const uniqueId = crypto.randomUUID();

    const documentExtension = path.extname(
      documentFile.originalname
    );

    const faceExtension = path.extname(
      referenceFaceFile.originalname
    );

    const documentName = `${uniqueId}-document${documentExtension}`;

    const faceName = `${uniqueId}-reference-face${faceExtension}`;

    const documentPath = path.join(
      uploadDirectory,
      documentName
    );

    const facePath = path.join(
      uploadDirectory,
      faceName
    );

    await fs.writeFile(
      documentPath,
      documentFile.buffer
    );

    await fs.writeFile(
      facePath,
      referenceFaceFile.buffer
    );

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      demoVoterId,
      walletAddress: walletAddress.toLowerCase(),
      documentReference: documentPath,
      faceReference: facePath,
      documentStatus: 'pending',
    });

    res.status(201).json({
      message: 'Registered',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        documentStatus: user.documentStatus,
      },
    });
  } catch (e) {
    res.status(400).json({
      message:
        e.code === 11000
          ? 'Email or demo voter ID already exists'
          : 'Registration failed',
    });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (
    !user ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    return res.status(401).json({
      message: 'Invalid email or password',
    });
  }

  res.json({
    token: signToken(user),
    user: safe(user),
  });
}

export async function nonce(req, res) {
  const { walletAddress } = req.body;

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      message: 'Invalid wallet address',
    });
  }

  const user = await User.findOne({
    walletAddress: walletAddress.toLowerCase(),
  });

  if (!user) {
    return res.status(404).json({
      message: 'Register this wallet first',
    });
  }

  const n = crypto.randomBytes(24).toString('hex');

  user.nonce = n;

  await user.save();

  res.json({
    nonce: n,
  });
}

export async function verifySignature(req, res) {
  const { walletAddress, signature } = req.body;

  const user = await User.findOne({
    walletAddress: walletAddress.toLowerCase(),
  });

  if (!user || !user.nonce) {
    return res.status(400).json({
      message: 'Nonce not found',
    });
  }

  const message = `Blockchain Voting Login
Nonce: ${user.nonce}`;

  let recovered;

  try {
    recovered = ethers.verifyMessage(
      message,
      signature
    );
  } catch {
    return res.status(400).json({
      message: 'Invalid signature',
    });
  }

  if (
    recovered.toLowerCase() !==
    walletAddress.toLowerCase()
  ) {
    return res.status(401).json({
      message: 'Signature does not match wallet',
    });
  }

  user.nonce = '';

  await user.save();

  res.json({
    token: signToken(user),
    user: safe(user),
  });
}

export async function me(req, res) {
  res.json({
    user: safe(req.user),
  });
}

function safe(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    walletAddress: u.walletAddress,
    demoVoterId: u.demoVoterId,
    documentStatus: u.documentStatus,
    verificationStatus: u.verificationStatus,
    eligibilityStatus: u.eligibilityStatus,
  };
}