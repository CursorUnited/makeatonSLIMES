import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { toIsoLocal } from '../../lib/dates.js';
import { config } from '../../config/index.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  let db = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'down';
  }
  res.status(db === 'ok' ? 200 : 503).json({
    status: db === 'ok' ? 'ok' : 'degraded',
    db,
    time: toIsoLocal(),
    version: config.version,
  });
});
