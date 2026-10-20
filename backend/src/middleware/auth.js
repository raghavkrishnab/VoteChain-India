import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required' });

  let payload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    return res.status(401).json({ message: 'Invalid or expired JWT' });
  }

  req.user = await User.findById(payload.sub);
  if (!req.user) return res.status(401).json({ message: 'User not found' });
  next();
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}
