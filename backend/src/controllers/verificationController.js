import FormData from 'form-data';
import axios from 'axios';
import path from 'path';

import { env } from '../config/env.js';
import { DOCUMENT_TYPES } from '../middleware/upload.js';
import { readFile } from '../services/storage.js';

const MIME_BY_EXTENSION = Object.fromEntries(Object.entries(DOCUMENT_TYPES).map(([mime, ext]) => [ext, mime]));
MIME_BY_EXTENSION['.jpeg'] = 'image/jpeg';

async function readStoredFile(filePath, label) {
  if (!filePath) return null;
  try {
    const buffer = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    return { buffer, filename: `${label}${extension}`, contentType: MIME_BY_EXTENSION[extension] || 'application/octet-stream' };
  } catch {
    return null;
  }
}

// Compares a new live photo with the face and document stored at registration.
// The reference image is always the server-side copy, so a voter cannot
// substitute a different "reference" photo to pass the match.
export async function face(req, res) {
  const live = req.file;
  if (!live) return res.status(400).json({ message: 'A live face image is required' });

  const user = req.user;
  if (user.documentStatus === 'approved') {
    return res.status(409).json({ message: 'Verification is already complete and approved' });
  }

  const reference = await readStoredFile(user.faceReference, 'reference');
  const document = await readStoredFile(user.documentReference, 'document');
  if (!reference || !document) {
    return res.status(400).json({ message: 'Registered reference face or voter document is missing; please contact the admin' });
  }

  const fd = new FormData();
  fd.append('image', live.buffer, { filename: live.originalname || 'live.jpg', contentType: live.mimetype });
  fd.append('reference', reference.buffer, { filename: reference.filename, contentType: reference.contentType });
  fd.append('document', document.buffer, { filename: document.filename, contentType: document.contentType });

  let result;
  try {
    ({ data: result } = await axios.post(`${env.AI_SERVICE_URL}/verify`, fd, {
      headers: { ...fd.getHeaders(), ...(env.AI_SERVICE_TOKEN && { 'X-Service-Token': env.AI_SERVICE_TOKEN }) },
      timeout: 90000,
    }));
  } catch (e) {
    // 4xx from the AI service are user-fixable (no face, blurry image, unreadable document).
    const status = e.response?.status;
    if (status && status < 500) {
      return res.status(400).json({ message: e.response.data?.detail || 'Verification input rejected' });
    }
    // 503 with a detail means "face model still loading": pass that on so the user knows to retry.
    const detail = status === 503 && e.response.data?.detail;
    return res.status(503).json({ message: detail || 'AI verification service is unavailable' });
  }

  const faceVerified = result.verified === true;
  user.verificationStatus = faceVerified ? 'verified' : 'rejected';
  user.eligibilityStatus = faceVerified && result.ageEligible === true ? 'eligible' : 'not_eligible';
  await user.save();

  res.json({
    similarity: result.similarity,
    threshold: result.threshold,
    faceVerified,
    dateOfBirth: result.dateOfBirth,
    age: result.age,
    ageEligible: result.ageEligible,
    liveness: result.liveness,
    user: user.toSafeJSON(),
  });
}
