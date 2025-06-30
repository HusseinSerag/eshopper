import { config, redisProvider } from '../main';

export function generateOTP() {
  // generate 6 digit otp
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// handling user otp ----> sending otp and saving to redis
export async function handleUserOtp(email: string) {
  const otp = generateOTP();
  // email.send(email, otp);

  // save otp to redis for ttl
  await redisProvider.setTTL(`otp:${email}`, otp, 60 * 5); // 5 minutes
}
export async function sendOtpFirstTime(email: string) {
  await handleUserOtp(email);

  await redisProvider.setTTL(
    `otp_cooldown:${email}`,
    '1',
    config.get('OTP_COOLDOWN_BASE_TIME')
  ); // 1 minute

  // count the number of times the user has sent otp
  await redisProvider.setTTL(
    `otp_cooldown_count:${email}`,
    '1',
    config.get('MAX_OTP_COOLDOWN_TIME')
  ); // 24 hours
}
