import * as crypto from 'crypto';
import { redisProvider } from '../provider';
import { BadRequestError } from '@eshopper/error-handler';

/**
 * Generates a secure reset password token, stores its hash in Redis, and returns the raw token.
 * @param email The user's email address
 * @param ttl Token expiration time in seconds (default: 1800 = 30 minutes)
 * @returns The raw reset token (to be sent in the email link)
 */
export async function generateAndStoreResetPasswordToken(
  email: string,
  ttl = 1800
): Promise<string> {
  // 1. Generate a secure random token (48 bytes, hex encoded)
  const rawToken = crypto.randomBytes(48).toString('hex');
  const randomId = crypto.randomBytes(16).toString('hex');
  // 2. Hash the token (SHA-256)
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  // 3. Store the hash in Redis with TTL
  await redisProvider.setTTL(
    `reset_password_token:${randomId}`,
    JSON.stringify({
      token: tokenHash,
      email,
    }),
    ttl
  );
  // 4. Return the raw token
  return `${rawToken}:${randomId}`;
}

/**
 * Verifies a reset password token by comparing the hash of the provided token with the stored hash in Redis.
 * @param email The user's email address
 * @param rawToken The token provided by the user (from the reset link)
 * @param consume If true, deletes the token from Redis after successful verification (default: true)
 * @returns True if the token is valid, false otherwise
 */
export async function verifyResetPasswordToken(token: string, consume = true) {
  const [rawToken, randomId] = token.split(':');
  if (!rawToken || !randomId) {
    return {
      email: undefined,
      result: false,
    };
  }
  const storedToken = await redisProvider.get(
    `reset_password_token:${randomId}`
  );
  if (!storedToken) {
    throw new BadRequestError('There is no request for resetting password');
  }
  const { token: storedTokenHash, email } = JSON.parse(storedToken);
  if (!email) {
    return {
      email: undefined,
      result: false,
    };
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (tokenHash !== storedTokenHash) {
    return {
      email: email as string,
      result: false,
    };
  }

  return {
    email: email as string,
    result: true,
    randomId,
  };
}
