import { Router } from 'express';
import multer from 'multer';

import {
  register,
  login,
  nonce,
  verifySignature,
  me,
} from '../controllers/authController.js';

import { auth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const r = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

r.post(
  '/register',
  authLimiter,
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'referenceFace', maxCount: 1 },
  ]),
  register
);

r.post('/login', authLimiter, login);

r.post('/nonce', authLimiter, nonce);

r.post('/verify-signature', authLimiter, verifySignature);

r.get('/me', auth, me);

export default r;
