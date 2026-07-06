import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  CLIENT_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(31).default(12),

  ACCESS_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // Rate limiting (per client IP). Optional — sensible defaults applied.
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  // Number of reverse proxies in front of the app (for correct client IPs).
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  logger.fatal({ fieldErrors }, 'Invalid or missing environment variables');
  // Throw (rather than process.exit) so serverless entrypoints can catch this
  // and return a readable error instead of an opaque crash.
  throw new Error(
    'Invalid or missing environment variables: ' + JSON.stringify(fieldErrors)
  );
}

export const envConfig = parsed.data;