import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthClient } from '../lib/client-auth';
import { useAuthContext } from '../context/useAuthContext';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const authContext = useAuthContext();
  const url = authContext.baseUrl + '/auth/login';
  const authClient = getAuthClient(queryClient, authContext.baseUrl);
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      // get access token and refresh token from headers 'Authorization' and 'fallback_refresh_token'
      const accessToken =
        response.headers.get('Authorization')?.split(' ')?.[1] ||
        response.headers.get('fallback_access_token') ||
        '';
      const refreshToken = response.headers.get('fallback_refresh_token') || '';
      console.log('accessToken and refreshToken', accessToken, refreshToken);

      if (!accessToken || !refreshToken) {
        throw new Error('Login failed');
      }

      authClient.loginHandler(accessToken, refreshToken);
    },
    onSuccess: async () => {
      // Invalidate any queries that depend on auth state

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'protected',
      });

      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
    onError: (error) => {
      console.log('Login failed', error);
    },
  });
};
