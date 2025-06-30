import { z } from 'zod';

export const ConfigSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  AUTH_SERVICE: z.string().default('http://localhost:3002'),
  HOST: z.string().default('localhost'),
});
