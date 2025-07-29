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
export interface SellerUser extends BaseUser {
  seller?: {
    id: string;
    stripeId?: string;
    phone_number?: string;
    isPhoneVerified: boolean;
    isOnboarded: boolean;
    country: string;
    createdAt: string;
    updatedAt: string;
    shop?: {
      id: string;
      name: string;
      bio?: string;

      coverBanner?: string;
      address: string;
      opening_hours: OpeningHours[];
      website: string;
      socialLinks: any;
      ratings: number;

      categoryId: string;

      otherCategory: string;

      createdAt: string;
      updatedAt: string;
    };
  };
}

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

export const daysOfTheWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type Category = {
  id: string;
  value: string;
  label: string;
};

export type Shop = {
  id: string;
  name: string;
  bio?: string | null;
  avatar?: any | null; // You can type this more strictly if you want
  coverBanner?: string | null;
  address: string;
  opening_hours?: OpeningHours[] | null;
  website: string;
  socialLinks: any[]; // You can type this more strictly if you want
  ratings: number;
  sellerId: string;
  categoryId: string;
  otherCategory?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerWithShop = {
  id: string;
  phone_number?: string | null;
  country: string;
  stripeId?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  shop?: Shop | null;
} | null;
export type OpeningHours = {
  day:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';
  open: string | null;
  close: string | null;
};

export type PhoneNumberVerificationInfo = {
  userCooldown: number;
  numberCooldown: number;
  tries: number;
  maxTries: number;
  number: string;
  maxRequest: number;
  windowForInvalidOtps: number;
  windowForRequests: number;
  numberOfRequestsPerWindow: number;
};
export * from './utils.js';

export * from './countries.js';
