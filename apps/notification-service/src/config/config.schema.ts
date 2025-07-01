import { z } from 'zod';

export const ConfigSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  HOST: z.string().default('localhost'),

  // Kafka Configuration
  KAFKA_BROKERS: z.string(),
  KAFKA_CLIENT_ID: z.string(),

  // Email Configuration
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1))
    .default('587'),
  EMAIL_USER: z.string(),
  EMAIL_PASS: z.string(),
  EMAIL_FROM: z.string(),
  EMAIL_FROM_NAME: z.string(),

  EMAIL_SERVICE: z.string(),
});
