import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('super-secret-jwt-key-replace-in-production-min-32-chars'),
  JWT_ACCESS_TOKEN_TTL: z.string().default('24h'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  AI_SERVICE_TOKEN: z.string().default('internal-secret-token-between-node-and-fastapi'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsedEnv.data;
