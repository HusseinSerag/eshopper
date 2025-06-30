import { redisProvider } from '../main';

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// handling user otp ----> sending otp and saving to redis
export async function handleUserOtp(email: string) {
  const otp = generateOTP();
  // email.send(email, otp);

  // save otp to redis for ttl
  await redisProvider.setTTL(`otp:${email}`, otp, 60 * 5);
}
