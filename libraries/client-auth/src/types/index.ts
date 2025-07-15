import type { User, MeResponse } from '@eshopper/shared-types';

export type { User, MeResponse };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RequestConfig {
  url: string;
  method?: 'post' | 'get' | 'patch' | 'delete' | 'put';
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

export type CookieOptions = {
  domain: string; // Domain name for the cookie (e.g., '.example.com')
  encode: (val: string) => string; // Custom function to encode the cookie value
  expires: Date; // Absolute expiration date
  httpOnly: boolean; // Prevent access from JavaScript (highly recommended for auth cookies)
  maxAge: number; // Number of seconds until the cookie expires
  path: string; // Path for which the cookie is valid (default is "/")
  sameSite: boolean | 'lax' | 'strict' | 'none'; // Controls when cookies are sent
  secure: boolean; // Send only over HTTPS
  priority: 'low' | 'medium' | 'high'; // Chrome optimization hint
};

export type Cookie = {
  name: string;
  value: string;
  options?: Partial<CookieOptions> | undefined;
};
