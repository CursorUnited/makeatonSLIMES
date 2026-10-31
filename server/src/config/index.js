import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_TEST: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_TTL_HOURS: z.coerce.number().int().positive().default(8),
  TZ: z.string().default('Asia/Kolkata'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  SMTP_URL: z.string().optional().default(''),
  BILLING_AUTO_CONFIRM: bool,
  BILLING_CRON: z.string().default('5 0 * * *'),
  RESET_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(30),
  PAGE_SIZE_MAX: z.coerce.number().int().positive().default(100),
  COMPANY_NAME: z.string().default('Brightloop Software'),
  COMPANY_ADDRESS: z.string().default('Lucknow, Uttar Pradesh'),
  COMPANY_EMAIL: z.string().default('billing@brightloop.test'),
  COMPANY_GSTIN: z.string().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

const env = parsed.data;

// Tests always run against the separate test database.
if (env.NODE_ENV === 'test' && env.DATABASE_URL_TEST) {
  env.DATABASE_URL = env.DATABASE_URL_TEST;
  process.env.DATABASE_URL = env.DATABASE_URL_TEST;
}

// "Today" for billing and overdue is always IST.
process.env.TZ = env.TZ;

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  jwtTtlHours: env.JWT_TTL_HOURS,
  appUrl: env.APP_URL,
  smtpUrl: env.SMTP_URL,
  billingAutoConfirm: env.BILLING_AUTO_CONFIRM,
  billingCron: env.BILLING_CRON,
  resetTokenTtlMin: env.RESET_TOKEN_TTL_MIN,
  pageSizeMax: env.PAGE_SIZE_MAX,
  company: {
    name: env.COMPANY_NAME,
    address: env.COMPANY_ADDRESS,
    email: env.COMPANY_EMAIL,
    gstin: env.COMPANY_GSTIN,
  },
  version: '1.0.0',
};
