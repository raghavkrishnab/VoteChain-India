import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';

import { env } from './config/env.js';
import { systemHealth } from './services/health.js';
import auth from './routes/auth.js';
import voters from './routes/voters.js';
import verification from './routes/verification.js';
import elections from './routes/elections.js';
import voting from './routes/voting.js';
import audit from './routes/audit.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => res.json(await systemHealth()));
app.use('/api/auth', auth);
app.use('/api/voters', voters);
app.use('/api/verification', verification);
app.use('/api/elections', elections);
app.use('/api/voting', voting);
app.use('/api/audit', audit);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Express 5 forwards rejected promises from async handlers here.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ message: err.message });
  if (err instanceof multer.MulterError) return res.status(400).json({ message: err.message });
  if (err instanceof mongoose.Error.CastError) return res.status(400).json({ message: `Invalid ${err.path}` });
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: 'Record already exists' });
  if (err.status === 503) return res.status(503).json({ message: err.message });
  if (err.code === 'CALL_EXCEPTION' || err.code === 'NETWORK_ERROR' || err.code === 'SERVER_ERROR') {
    console.error('Blockchain call failed:', err.shortMessage || err.message);
    return res.status(502).json({ message: 'Blockchain request failed' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
