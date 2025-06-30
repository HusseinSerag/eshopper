import { z } from 'zod';

export const ConfigSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  GATEWAY_ORIGIN: z.string().default('http://localhost:3000'),
  HOST: z.string().default('localhost'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
});
