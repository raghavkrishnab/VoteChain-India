import rateLimit from 'express-rate-limit';

const limiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests; try again later.' },
  });

export const authLimiter = limiter(30);
// Face matching and OCR are expensive; also limits brute-forcing the match.
export const verificationLimiter = limiter(10);
