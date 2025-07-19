// User types
export type BaseUser = {
  avatar?: {
    id: string;
    url: string;
    file_id?: string;
  };
  emailOwnership: Array<{
    email: string;
    isVerified: boolean;
  }>;
  account: Array<{
    id: string;
    type: AccountType;
    isPrimary: boolean;
    email: string;
    createdAt: string;
  }>;
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  role: OriginSite;
};
export interface ShopperUser extends BaseUser {}
export interface SellerUser extends BaseUser {}

// Account types
export enum AccountType {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
}

// API Response types
export interface MeShopperResponse {
  user: ShopperUser;
}
export interface MeSellerResponse {
  user: SellerUser;
}

// OAuth types
export interface OAuthError {
  code: string;
  message: string;
  description?: string;
  action?: string;
}

export interface ErrorResponse {
  isError: true;
  status: number;
  message: string;
  timestamp: string;
  resCode: number;
}

export interface OAuthState {
  action: OAuthModes;
  userId?: string;
  nonce: string;
  timestamp: number;
  returnTo?: string;
  url: string;
  origin: string;
}

// Utility types
export type UserWithPrimaryEmail = ShopperUser & {
  primaryEmail: string;
  primaryEmailVerified: boolean;
};

export type UserWithAccounts = ShopperUser & {
  hasPasswordAccount: boolean;
  hasGoogleAccount: boolean;
  primaryAccount: ShopperUser['account'][0];
};

export type VerificationInfoResponse = {
  cooldown: number;
  numberOfRequestsPerWindow: number;
  invalidOtpCount: number;
  maxInvalidOTP: number;
  maxResendRequests: number;
  newRequestWindow: number;
};

export type BlockedInfoResponse = {
  isBlocked: number;
};

export type OAuthModes = 'link' | 'login' | 'signup';
export type OriginSite = 'seller' | 'admin' | 'shopper';
// Re-export utilities
export * from './utils.js';
