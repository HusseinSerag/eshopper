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
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('auth-service'),
  MAX_OTP_COUNT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  MAX_OTP_COOLDOWN_TIME: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  OTP_COOLDOWN_BASE_TIME: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  OTP_COOLDOWN_STEP: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  MAX_INVALID_OTP_COUNT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  MAX_INVALID_OTP_WINDOW: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  BLOCKED_TIME: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  MAX_RESET_PASSWORD_COUNT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  RESET_PASSWORD_COOLDOWN_TIME: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  RESET_PASSWORD_COOLDOWN_BASE_TIME: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  RESET_PASSWORD_COOLDOWN_STEP: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  MAX_RESET_PASSWORD_COOLDOWN_TIME: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  CLIENT_ORIGIN: z.string(),
  SELLER_ORIGIN: z.string(),
  MAX_FALSE_TOKEN_COUNT_WINDOW: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  MAX_FALSE_TOKEN_COUNT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  MAX_PASSWORD_CHANGE_WINDOW: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  NODE_ENV: z.string().default('development'),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_OAUTH_REDIRECT_URL: z.string(),
  PHONE_NUMBER_STEP: z.string().transform((val) => parseInt(val, 10)),
  PHONE_NUMBER_BASE_TIME: z.string().transform((val) => parseInt(val, 10)),
  MAX_INVALID_PHONE_NUMBER_OTP: z
    .string()
    .transform((val) => parseInt(val, 10)),
  MAX_REQUEST_PHONE_NUMBER: z.string().transform((val) => parseInt(val, 10)),
  MAX_INVALID_PHONE_NUMBER_WINDOW: z
    .string()
    .transform((val) => parseInt(val, 10)),
  MAX_REQUEST_WINDOW: z.string().transform((val) => parseInt(val, 10)),
});
