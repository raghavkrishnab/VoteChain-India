import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

const connect = () => mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME, serverSelectionTimeoutMS: 15000 });

export async function connectDB() {
  try {
    await connect();
  } catch (e) {
    // mongodb+srv:// needs an SRV DNS lookup. Some routers/hotspots refuse SRV
    // queries from Node's resolver even though Windows resolves them, so retry
    // once with public DNS servers.
    if (e.syscall !== 'querySrv') throw e;
    console.warn(`SRV lookup failed via system DNS (${e.code}); retrying with public DNS (1.1.1.1, 8.8.8.8).`);
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    await connect();
  }
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`);
}
