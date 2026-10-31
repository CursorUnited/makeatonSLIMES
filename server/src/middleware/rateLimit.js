import { AppError } from '../lib/errors.js';

/** Small in-memory limiter: `max` calls per `windowMs` per IP and route. Off in tests. */
export function rateLimit({ max = 10, windowMs = 60_000 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return next(new AppError('RATE_LIMITED', 'Too many attempts. Please wait a minute and try again.', 429));
    }
    next();
  };
}
