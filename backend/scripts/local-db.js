// Runs a MongoDB server on this machine for local mode (no Atlas needed).
// Data is kept in backend/.localdb between runs. Stop with Ctrl+C.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.localdb');
fs.mkdirSync(dbPath, { recursive: true });

console.log('Starting local MongoDB (the first run downloads the MongoDB server, ~100 MB)...');
const server = await MongoMemoryServer.create({ instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' } });
console.log(`Local MongoDB running at ${server.getUri()} (data: ${dbPath})`);

const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
