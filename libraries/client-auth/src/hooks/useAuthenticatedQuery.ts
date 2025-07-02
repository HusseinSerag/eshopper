import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
//import { getAuthClient } from "../lib/client-auth";
import { useAuth } from './use-auth';
import { getAuthClient } from '../lib/client-auth';
import { useAuthContext } from '../context/useAuthContext';

export const useAuthenticatedQuery = <TData = unknown>(
  queryKey: (string | number)[],
  url: string,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const authContext = useAuthContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  return useQuery({
    queryKey: ['protected', ...queryKey],
    queryFn: async (): Promise<TData> => {
      const authClient = getAuthClient(queryClient, authContext.baseUrl);
      return (await authClient.request({
        url,
        method: 'GET',
        baseUrl: authContext.baseUrl,
      })) as TData;
    },
    enabled: isAuthenticated && !authLoading && (options?.enabled ?? true),
    ...options,
  });
};
