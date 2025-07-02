export interface BaseUser {
  id: string;
  email: string;
}

export type User<T = {}> = BaseUser & T;

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
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
  baseUrl: string;
}
