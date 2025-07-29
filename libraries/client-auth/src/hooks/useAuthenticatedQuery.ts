import {
  useSuspenseQuery,
  UseQueryOptions,
  useQuery,
} from '@tanstack/react-query';

import { useAuth } from './use-auth';

import { useAuthContext } from '../context/useAuthContext';
import { useOffline } from './useOffline';

export const useAuthenticatedQuery = <TData = unknown>(
  queryKey: (string | number)[],
  url: string,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) => {
  const { isOffline } = useOffline();
  const authContext = useAuthContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['protected', ...queryKey],
    queryFn: async (): Promise<TData> => {
      return (await authContext.httpClient.request({
        url,
        method: 'get',
      })) as TData;
    },
    retry: false,

    staleTime: Infinity,
    enabled:
      isAuthenticated &&
      !authLoading &&
      (options?.enabled ?? true) &&
      !isOffline,
    ...options,
  });
};
