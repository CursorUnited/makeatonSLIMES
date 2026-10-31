import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

/** Single Prisma client for the whole process. */
export const prisma = new PrismaClient({
  datasources: { db: { url: config.databaseUrl } },
});
