'use client';
import { QueryClient } from '@tanstack/react-query';
import { RequestConfig } from '../types';
import {
  NetworkError,
  AuthError,
  TokenRefreshError,
  RequestFailedError,
} from './errors';
// Custom error classes

export class AuthenticatedHttpClient {
  private refreshPromise: Promise<void> | null = null;
  private isRefreshing = false;
  private refreshAttempts = 0;
  private maxRefreshAttempts = 3;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private requestQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    config: RequestConfig;
  }> = [];
  private baseUrl: string;
  private logger: (...args: any[]) => void;

  /**
   * @param queryClient TanStack QueryClient instance
   * @param baseUrl API base URL (e.g. "/api")
   * @param logger Optional logger function (defaults to console.error)
   */
  constructor(
    private queryClient: QueryClient,
    baseUrl = '',
    logger: (...args: any[]) => void = (...args) => console.error(...args)
  ) {
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  // login event handler
  loginHandler(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
  logoutHandler() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * Attempts to refresh the access token with exponential backoff.
   * Throws TokenRefreshError if all attempts fail.
   */
  private async doRefresh(): Promise<void> {
    let delay = 500;
    while (this.refreshAttempts < this.maxRefreshAttempts) {
      try {
        this.refreshAttempts++;
        const url = this.baseUrl + '/auth/refresh';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.accessToken && {
              Authorization: `Bearer ${this.accessToken}`,
            }),
            ...(this.refreshToken && {
              fallback_refresh_token: this.refreshToken,
            }),
            ...(this.accessToken && {
              fallback_access_token: this.accessToken,
            }),
          },
          credentials: 'include',
        });
        if (!response.ok) {
          throw new TokenRefreshError('Failed to refresh access token');
        }
        const data = (await response.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        if (!data.accessToken || !data.refreshToken) {
          throw new TokenRefreshError('Invalid refresh token response');
        }
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.refreshAttempts = 0;
        return;
      } catch (err) {
        this.logger('Token refresh attempt failed', err);
        if (this.refreshAttempts >= this.maxRefreshAttempts) {
          throw new TokenRefreshError(
            'Failed to refresh access token after retries'
          );
        }
        await this.wait(delay);
        delay *= 2; // exponential backoff
      }
    }
  }
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  private async handleTokenRefresh() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }
    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();
    try {
      await this.refreshPromise;
      await this.processQueue();
    } catch (error) {
      this.rejectQueue(error as Error);
      this.queryClient.setQueryData(['auth', 'user'], null);
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }
  private async processQueue() {
    const queue = [...this.requestQueue];
    this.requestQueue = [];
    for (const { resolve, reject, config } of queue) {
      try {
        const response = await this.executeRequest(config);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    }
  }

  private async rejectQueue(error: Error) {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const { reject } of queue) {
      reject(error);
    }
  }

  private async executeRequest(config: RequestConfig) {
    // @ts-expect-error: window is only available in the browser
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      throw new NetworkError('No internet connection');
    }

    const res = await fetch(config.url, {
      method: config.method,
      headers: { ...config.headers },
      body: config.body,
      credentials: 'include',
      signal: config.signal,
    });

    if (res.status === 401) {
      const errorData = (await res.json().catch(() => ({}))) as any;
      if (errorData.resCode === 4011) {
        throw new AuthError('TOKEN_EXPIRED');
      } else {
        this.queryClient.setQueryData(['auth', 'user'], null);
        throw new AuthError('Unauthorized');
      }
    }

    if (!res.ok) {
      throw new RequestFailedError(`Request failed with status ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    return res.text();
  }

  /**
   * Makes an authenticated request. Handles token refresh and queuing.
   * @param config RequestConfig
   */
  async request(config: RequestConfig) {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject, config });
      });
    }
    try {
      return await this.executeRequest(config);
    } catch (error) {
      if (error instanceof AuthError && error.message === 'TOKEN_EXPIRED') {
        await this.handleTokenRefresh();
        return this.executeRequest(config);
      }
      throw error;
    }
  }
  clearQueue(): void {
    this.rejectQueue(new Error('Authentication cleared'));
    this.refreshPromise = null;
    this.isRefreshing = false;
    this.refreshAttempts = 0;
  }
}

let authClient: AuthenticatedHttpClient | null = null;

export const getAuthClient = (queryClient: QueryClient, baseUrl: string) => {
  if (!authClient) {
    authClient = new AuthenticatedHttpClient(queryClient, baseUrl);
  }
  return authClient;
};

export const resetAuthClient = () => {
  if (authClient) {
    authClient.clearQueue();
    authClient = null;
  }
};

// Export RequestConfig for type safety
export type { RequestConfig };
