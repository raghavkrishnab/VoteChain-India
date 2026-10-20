import fs from 'fs/promises';
import mongoose from 'mongoose';

// Uploaded ID documents and reference faces are stored in MongoDB (GridFS), so
// they survive redeploys on hosts with a temporary disk (e.g. Render).
// References look like "gridfs:<id>/<filename>"; older records may still hold a
// plain file path on disk, which keeps working.
const PREFIX = 'gridfs:';

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

function parse(ref) {
  const [id, ...name] = ref.slice(PREFIX.length).split('/');
  return { id: new mongoose.Types.ObjectId(id), filename: name.join('/') };
}

export function saveFile(buffer, filename, contentType) {
  return new Promise((resolve, reject) => {
    const upload = bucket().openUploadStream(filename, { metadata: { contentType } });
    upload.on('error', reject).on('finish', () => resolve(`${PREFIX}${upload.id}/${filename}`));
    upload.end(buffer);
  });
}

export async function readFile(ref) {
  if (!ref.startsWith(PREFIX)) return fs.readFile(ref);
  const chunks = [];
  for await (const chunk of bucket().openDownloadStream(parse(ref).id)) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function deleteFile(ref) {
  if (!ref) return;
  if (ref.startsWith(PREFIX)) await bucket().delete(parse(ref).id);
  else await fs.unlink(ref);
}
