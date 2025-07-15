import { Redis } from '@eshopper/redis';

export async function deleteOTPState(redisProvider: Redis, email: string) {
  await Promise.all([
    redisProvider.delete(`otp:${email}`),
    redisProvider.delete(`invalid_otp_count:${email}`),
    redisProvider.delete(`otp_cooldown:${email}`),
    redisProvider.delete(`otp_cooldown_count:${email}`),
  ]);
}

export async function deletePasswordState(redisProvider: Redis, email: string) {
  await Promise.all([
    redisProvider.delete(`reset_password_cooldown:${email}`),
    redisProvider.delete(`reset_password_count:${email}`),
  ]);
}
