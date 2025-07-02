import { useAuthContext } from '../context/useAuthContext';
import { getAuthClient } from '../lib/client-auth';
import { useAuth } from './use-auth';
import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
interface AuthenticatedMutationConfig {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}
export const useAuthenticatedMutation = <TData = unknown, TVariables = unknown>(
  config: AuthenticatedMutationConfig,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const authContext = useAuthContext();
  return useMutation({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const authClient = getAuthClient(queryClient, authContext.baseUrl);
      return authClient.request({
        url: config.url,
        method: config.method || 'POST',
        body: JSON.stringify(variables),
        signal: options?.meta?.signal as AbortSignal, // Support cancellation
        baseUrl: authContext.baseUrl,
      }) as TData;
    },
    onError: async (error) => {
      // If auth error during mutation, ensure user gets logged out
      if (
        error instanceof Error &&
        (error.message === 'Unauthorized' ||
          error.message === 'Authentication failed')
      ) {
        await queryClient.setQueryData(['auth', 'user'], null);
        await queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === 'auth' && query.queryKey[1] === 'user',
        });
        const authClient = getAuthClient(queryClient, authContext.baseUrl);
        authClient.logoutHandler();
      }
      options?.onError?.(error, {} as TVariables, undefined);
    },
    ...options,
  });
};
