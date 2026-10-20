import { Router } from 'express';

import { auth } from '../middleware/auth.js';
import { verificationLimiter } from '../middleware/rateLimit.js';
import { upload } from '../middleware/upload.js';
import { face } from '../controllers/verificationController.js';

const r = Router();

r.post('/face', auth, verificationLimiter, upload.single('image'), face);

export default r;
