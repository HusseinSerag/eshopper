import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { useAuth } from './use-auth';

import { useAuthContext } from '../context/useAuthContext';

export const useAuthenticatedQuery = <TData = unknown>(
  queryKey: (string | number)[],
  url: string,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) => {
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
    enabled: isAuthenticated && !authLoading && (options?.enabled ?? true),
    ...options,
  });
};
