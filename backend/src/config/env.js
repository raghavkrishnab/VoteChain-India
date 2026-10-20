// Values already in the environment win, so the *:local scripts can layer
// .env.localchain (via node --env-file) over .env.
import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: process.env.MONGODB_URI || '',
  // Optional; overrides the database named in MONGODB_URI (local-chain mode uses its own).
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || undefined,
  JWT_SECRET: process.env.JWT_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  // Optional shared secret sent to the AI service (required there when it sets AI_SERVICE_TOKEN).
  AI_SERVICE_TOKEN: process.env.AI_SERVICE_TOKEN || '',
  BLOCKCHAIN_RPC_URL: process.env.BLOCKCHAIN_RPC_URL || '',
  CHAIN_ID: Number(process.env.CHAIN_ID || 11155111),
  CONTRACT_ADDRESS: (process.env.CONTRACT_ADDRESS || '').toLowerCase(),
};

// Settings the server cannot run without. Checked at startup, not at import,
// so tests can load the app without a full configuration.
export function assertRequiredEnv() {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if (env.JWT_SECRET.length < 16) throw new Error('JWT_SECRET must be at least 16 characters');
  if (!env.BLOCKCHAIN_RPC_URL || !env.CONTRACT_ADDRESS) {
    console.warn('BLOCKCHAIN_RPC_URL/CONTRACT_ADDRESS not set: election, vote and approval endpoints will return 503.');
  }
}
