import { useQuery } from '@tanstack/react-query';

import type { MeSellerResponse, SellerUser } from '@eshopper/shared-types';
import { useAuthContext } from '../context/useAuthContext';
import { BlockedError } from '../lib/errors';

export function useSeller() {
  const authContext = useAuthContext();

  const {
    data: user,
    isPending: isLoading,
    isError,
    refetch,
  } = useQuery<
    | { user: SellerUser; success: true }
    | {
        success: false;
        user: null;
        isBlocked: boolean;
      }
  >({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const response = (await authContext.httpClient.request({
          url: '/auth/seller/me',
          method: 'get',
        })) as MeSellerResponse;
        return { user: response.user, success: true };
      } catch (e) {
        if (e instanceof BlockedError)
          return {
            success: false,
            user: null,
            isBlocked: true,
          };
        return {
          success: false,
          user: null,
          isBlocked: false,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // don't retry
  });

  const isAuthenticated = !isLoading && !isError && user.success && !!user.user;
  const isBlocked = !isLoading && !isError && !user.success && user.isBlocked;

  return { user, isAuthenticated, isLoading, refetch, isBlocked };
}
