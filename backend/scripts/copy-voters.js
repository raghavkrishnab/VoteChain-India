// Copies voter accounts (and their uploaded ID/face files) from the local-mode
// database into the database in backend/.env (e.g. MongoDB Atlas for Render).
// Nothing is deleted anywhere; voters whose email already exists are skipped.
//
//   npm run db:local        (in another terminal, so the local database is running)
//   npm run copy-voters
//
// Copied voters keep their AI verification results but start as "pending"
// approval, because the new blockchain contract doesn't know their wallets yet.
import 'dotenv/config';
import fs from 'fs/promises';
import mongoose from 'mongoose';

const SOURCE_URI = process.env.SOURCE_MONGODB_URI || 'mongodb://127.0.0.1:27017/';
const SOURCE_DB = process.env.SOURCE_DB_NAME || 'voting_localchain';
const TARGET_URI = process.env.MONGODB_URI;

if (!TARGET_URI || TARGET_URI.includes('127.0.0.1') || TARGET_URI.includes('localhost')) {
  console.error('Set MONGODB_URI in backend/.env to the online database (e.g. your Atlas connection string) first.');
  process.exit(1);
}

const source = await mongoose.createConnection(SOURCE_URI, { dbName: SOURCE_DB, serverSelectionTimeoutMS: 5000 }).asPromise();
const target = await mongoose.createConnection(TARGET_URI, { serverSelectionTimeoutMS: 15000 }).asPromise();
const sourceFiles = new mongoose.mongo.GridFSBucket(source.db, { bucketName: 'uploads' });
const targetFiles = new mongoose.mongo.GridFSBucket(target.db, { bucketName: 'uploads' });

async function readSourceFile(ref) {
  if (!ref.startsWith('gridfs:')) return fs.readFile(ref);
  const id = new mongoose.Types.ObjectId(ref.slice('gridfs:'.length).split('/')[0]);
  const chunks = [];
  for await (const chunk of sourceFiles.openDownloadStream(id)) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function writeTargetFile(buffer, filename) {
  return new Promise((resolve, reject) => {
    const upload = targetFiles.openUploadStream(filename);
    upload.on('error', reject).on('finish', () => resolve(`gridfs:${upload.id}/${filename}`));
    upload.end(buffer);
  });
}

const fileName = (ref, base) => `${base}${ref.match(/\.[a-z]+$/i)?.[0] || ''}`;

const voters = await source.collection('users').find({ role: 'voter' }).toArray();
const targetUsers = target.collection('users');
let copied = 0;

for (const voter of voters) {
  if (await targetUsers.findOne({ $or: [{ email: voter.email }, { walletAddress: voter.walletAddress }] })) {
    console.log(`skip   ${voter.name} (already in target)`);
    continue;
  }
  const { _id, documentReference, faceReference, ...rest } = voter;
  try {
    const doc = {
      ...rest,
      documentReference: documentReference ? await writeTargetFile(await readSourceFile(documentReference), fileName(documentReference, 'document')) : '',
      faceReference: faceReference ? await writeTargetFile(await readSourceFile(faceReference), fileName(faceReference, 'reference-face')) : '',
      documentStatus: 'pending',
      nonce: '',
    };
    await targetUsers.insertOne(doc);
    copied += 1;
    console.log(`copied ${voter.name}`);
  } catch (e) {
    console.log(`FAILED ${voter.name}: ${e.message}`);
  }
}

console.log(`\n${copied} of ${voters.length} voters copied to ${target.name}.`);
await Promise.all([source.close(), target.close()]);
