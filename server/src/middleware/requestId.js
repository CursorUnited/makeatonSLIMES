import { randomUUID } from 'node:crypto';

/** Tags every request with an id, echoed in `X-Request-Id` and in 500 responses. */
export function requestId(req, res, next) {
  req.id = randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', req.id);
  next();
}
