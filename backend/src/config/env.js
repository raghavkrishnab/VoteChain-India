import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
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
