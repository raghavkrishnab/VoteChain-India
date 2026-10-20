import axios from 'axios';
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { getChainHealth } from './chain.js';

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), ms))]);

async function check(fn) {
  try {
    return { ok: true, ...(await withTimeout(fn(), 3000)) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Status of every dependency, so the UI can say exactly what is down.
export async function systemHealth() {
  const [database, ai, blockchain] = await Promise.all([
    check(async () => {
      if (mongoose.connection.readyState !== 1) throw new Error('not connected');
      return { name: mongoose.connection.name };
    }),
    check(async () => {
      const { data } = await axios.get(`${env.AI_SERVICE_URL}/health`, { timeout: 3000 });
      if (data.modelReady === false) throw new Error('face model is still loading (first start downloads ~300 MB)');
      return {};
    }),
    check(getChainHealth),
  ]);
  return { ok: database.ok && ai.ok && blockchain.ok, service: 'backend', database, ai, blockchain };
}
