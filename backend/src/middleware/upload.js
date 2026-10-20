import multer from 'multer';
import { httpError } from '../utils/httpError.js';

// File extension is derived from the validated MIME type, never from the client's filename.
export const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/bmp': '.bmp' };
export const DOCUMENT_TYPES = { ...IMAGE_TYPES, 'application/pdf': '.pdf' };

const DOCUMENT_FIELDS = new Set(['document']);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter(req, file, cb) {
    const allowed = DOCUMENT_FIELDS.has(file.fieldname) ? DOCUMENT_TYPES : IMAGE_TYPES;
    if (allowed[file.mimetype]) return cb(null, true);
    cb(httpError(400, `Unsupported file type for ${file.fieldname}: ${file.mimetype}`));
  },
});
