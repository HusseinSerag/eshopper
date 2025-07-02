import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthClient } from '../lib/client-auth';
import { User } from '../types';
import { useAuthContext } from '../context/useAuthContext';

export function useAuth() {
  const queryClient = useQueryClient();
  const authContext = useAuthContext();
  const authClient = getAuthClient(queryClient, authContext.baseUrl);
  const {
    data: user,
    isPending: isLoading,
    isError,
    refetch,
  } = useQuery<User | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const user = (await authClient.request({
          url: authContext.baseUrl + '/auth/me',
          method: 'GET',
          baseUrl: authContext.baseUrl,
        })) as User;
        return user;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // don't retry
  });

  const isAuthenticated = !!user && !isError && !isLoading;
  return { user, isAuthenticated, isLoading, refetch };
}
