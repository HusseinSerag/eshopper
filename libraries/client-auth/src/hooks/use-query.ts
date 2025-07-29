import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { useAuthContext } from '../context/useAuthContext';
import { useOffline } from './useOffline';

export const useCustomQuery = <TData = unknown>(
  queryKey: (string | number)[],
  url: string,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) => {
  const authContext = useAuthContext();
  const { isOffline } = useOffline();
  return useQuery({
    queryKey: [...queryKey],
    queryFn: async (): Promise<TData> => {
      return (await authContext.httpClient.request({
        url,
        method: 'get',
      })) as TData;
    },
    enabled: (!isOffline && options?.enabled) ?? true,
    ...options,
  });
};
