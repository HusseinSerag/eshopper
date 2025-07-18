import type { ShopperUser } from './index.js';

/**
 * Get the primary email from a user's email ownership
 */
export function getPrimaryEmail(user: ShopperUser): string | null {
  const verifiedEmail = user.emailOwnership.find((eo) => eo.isVerified);
  return verifiedEmail?.email || null;
}

/**
 * Check if user has a verified email
 */
export function hasVerifiedEmail(user: ShopperUser): boolean {
  return user.emailOwnership.some((eo) => eo.isVerified);
}

/**
 * Check if user has a specific account type
 */
export function hasAccountType(
  user: ShopperUser,
  type: 'PASSWORD' | 'GOOGLE'
): boolean {
  return user.account.some((acc) => acc.type === type);
}

/**
 * Get the primary account
 */
export function getPrimaryAccount(user: ShopperUser) {
  return user.account.find((acc) => acc.isPrimary) || user.account[0];
}

/**
 * Get user with computed primary email properties
 */
export function getUserWithPrimaryEmail(user: ShopperUser) {
  const primaryEmail = getPrimaryEmail(user);
  const primaryEmailVerified = hasVerifiedEmail(user);

  return {
    ...user,
    primaryEmail: primaryEmail || '',
    primaryEmailVerified,
  };
}

/**
 * Get user with computed account properties
 */
export function getUserWithAccounts(user: ShopperUser) {
  const hasPasswordAccount = hasAccountType(user, 'PASSWORD');
  const hasGoogleAccount = hasAccountType(user, 'GOOGLE');
  const primaryAccount = getPrimaryAccount(user);

  return {
    ...user,
    hasPasswordAccount,
    hasGoogleAccount,
    primaryAccount,
  };
}
