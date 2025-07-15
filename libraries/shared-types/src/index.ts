// User types
export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
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
}

// Account types
export enum AccountType {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
}

// API Response types
export interface MeResponse {
  user: User;
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
  action: 'link' | 'login' | 'signup';
  userId?: string;
  nonce: string;
  timestamp: number;
  returnTo?: string;
}

// Utility types
export type UserWithPrimaryEmail = User & {
  primaryEmail: string;
  primaryEmailVerified: boolean;
};

export type UserWithAccounts = User & {
  hasPasswordAccount: boolean;
  hasGoogleAccount: boolean;
  primaryAccount: User['account'][0];
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
// Re-export utilities
export * from './utils.js';
