import app from './app.js';
import { env, assertRequiredEnv } from './config/env.js';
import { connectDB } from './config/db.js';

try {
  assertRequiredEnv();
  await connectDB();
  app.listen(env.PORT, () => console.log(`Server running on http://localhost:${env.PORT}`));
} catch (e) {
  console.error('Startup failed:', e.message);
  process.exit(1);
}
