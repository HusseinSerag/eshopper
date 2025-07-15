import { RequestConfig } from '../types';
import {
  AuthError,
  TokenRefreshError,
  RequestFailedError,
  BlockedError,
} from './errors';
import { AxiosClient } from '@eshopper/utils/client';
import { ErrorResponse } from '@eshopper/shared-types';
import { AxiosError } from 'axios';

// Custom error classes
type ProcessingQueue = {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  config: RequestConfig;
};

export class AuthenticateHttpClient {
  // when user request we need to try to refresh
  private isRefreshing: boolean;
  private onRefreshCallback?(): void;
  queue: ProcessingQueue[];
  refreshPromise: Promise<void> | null = null;
  public onUnauthenticatedRequest?(): void;
  constructor(private axiosInstance: AxiosClient, private refreshUrl: string) {
    this.isRefreshing = false;
    this.queue = [];
  }

  onRefresh(cb: () => void) {
    this.onRefreshCallback = cb;
  }
  private enqueueRequest(config: RequestConfig) {
    return new Promise((res, rej) => {
      this.queue.push({
        config,
        reject: rej,
        resolve: res,
      });
    });
  }
  private async processQueue() {
    const toWork = [...this.queue];
    this.queue = [];
    for (const work of toWork) {
      // do the work
      try {
        const response = await this.executeRequest(work.config);
        work.resolve(response);
      } catch (e) {
        work.reject(e);
      }
    }
  }
  private async rejectQueue(error: Error) {
    const toWork = [...this.queue];
    this.queue = [];
    for (const { reject } of toWork) {
      // reject the work
      reject(error);
    }
  }
  private async doRefresh(): Promise<void> {
    try {
      await this.axiosInstance.getInstance().request({
        url: this.refreshUrl,
        method: 'POST',
      });
    } catch (err: unknown) {
      if (err instanceof AxiosError)
        throw new TokenRefreshError(err.response?.data.message);

      throw new TokenRefreshError('Token refresh failed');
      // await this.wait(delay);
      // delay *= 2; // exponential backoff
    }
  }
  // private wait(ms: number): Promise<void> {
  //   return new Promise((resolve) => setTimeout(resolve, ms));
  // }
  async executeRequest(config: RequestConfig) {
    const axiosConfiguration = {
      url: config.url,
      method: config.method?.toUpperCase() ?? 'GET',
      data: config.body,
      headers: config.headers,
      signal: config.signal,
    };
    try {
      const response = await this.axiosInstance
        .getInstance()
        .request(axiosConfiguration);

      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        return response.data;
      }
      // fallback for plain text or other types
      return response.data?.toString?.() ?? response.data;
    } catch (e: any) {
      if (e instanceof AxiosError) {
        const data = e.response?.data as ErrorResponse;

        if (e.response?.status === 401) {
          if (data.resCode === 4011) {
            // refresh token needed

            throw new AuthError('REFRESH_NEEDED');
          } else {
            if (this.onUnauthenticatedRequest) {
              this.onUnauthenticatedRequest();
            }
            if (data.resCode === 5000) {
              throw new BlockedError();
            }
            throw new AuthError('Unauthorized');
          }
        } else {
          throw new RequestFailedError(data.message);
        }
      } else {
        throw new RequestFailedError(e.message);
      }
    }
  }
  private async handleTokenRefresh() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }
    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();
    try {
      await this.refreshPromise;
      if (this.onRefreshCallback) this.onRefreshCallback();
      await this.processQueue();
    } catch (error) {
      this.rejectQueue(error as Error);
      if (this.onUnauthenticatedRequest) {
        this.onUnauthenticatedRequest();
      }
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async request(config: RequestConfig) {
    if (this.isRefreshing) {
      // push to queue
      return this.enqueueRequest(config);
    }
    try {
      return await this.executeRequest(config);
    } catch (error) {
      if (error instanceof AuthError && error.message === 'REFRESH_NEEDED') {
        // refresh

        await this.handleTokenRefresh();
        //execute again
        return this.executeRequest(config);
      } else {
        throw error;
      }
    }
  }
  clearQueue(): void {
    this.rejectQueue(new Error('Authentication cleared'));
    this.refreshPromise = null;
    this.isRefreshing = false;
  }
}

let authClient: AuthenticateHttpClient | null = null;

export const getAuthClient = (axiosClient: AxiosClient) => {
  if (!authClient) {
    authClient = new AuthenticateHttpClient(axiosClient, '/auth/refresh');
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
