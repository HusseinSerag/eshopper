'use client';

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import {
  AuthError,
  NetworkError,
  RequestFailedError,
  TokenRefreshError,
} from '@eshopper/client-auth';
import { AuthProviderWrapper } from './authProviderWrapper';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GeoProvider } from '@eshopper/ui';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof NetworkError) return failureCount < 3;
          if (error instanceof AuthError || error instanceof TokenRefreshError)
            return false;
          if (error instanceof RequestFailedError) return false;
          return failureCount < 3;
        },
        staleTime: 1000 * 60 * 5,
      },
      mutations: {
        retry: (failureCount, error) => {
          if (error instanceof AuthError || error instanceof TokenRefreshError)
            return false;
          return failureCount < 1;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | null = null;

export function getQueryClient() {
  if (isServer) {
    // server always make a new query client
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
export function ClientProviders({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <GeoProvider>
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </GeoProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
