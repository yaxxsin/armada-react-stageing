import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL harus berupa URL PostgreSQL yang valid'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET minimal 16 karakter'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().url('CLIENT_ORIGIN harus berupa URL yang valid').default('http://localhost:5174'),
  PORT: z.coerce.number().int().positive().default(4001),
});

export const config = envSchema.parse(process.env);