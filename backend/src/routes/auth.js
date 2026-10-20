import { Router } from 'express';

import { register, login, nonce, verifySignature, me } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { upload } from '../middleware/upload.js';

const r = Router();

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
