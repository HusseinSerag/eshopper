import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useAuthContext } from '../context/useAuthContext';
import { ErrorResponse } from '@eshopper/shared-types';
import { RequestError } from '../lib/errors';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { httpClient } = useAuthContext();
  const url = '/auth/login';
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      try {
        await httpClient.request({
          url,
          body: credentials,
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (e) {
        if (e instanceof AxiosError) {
          const data = e.response?.data as ErrorResponse;
          throw new Error(data.message);
        } else if (e instanceof RequestError) {
          throw new Error(e.message);
        }
        throw new Error('Login Failed');
      }

      // get access token and refresh token from headers 'Authorization' and 'fallback_refresh_token'
      // const accessToken =
      //   response.headers.get('Authorization')?.split(' ')?.[1] ||
      //   response.headers.get('fallback_access_token') ||
      //   '';
      // const refreshToken = response.headers.get('fallback_refresh_token') || '';
    },
    onSuccess: async () => {
      // Invalidate any queries that depend on auth state

      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'protected',
      });

      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
    retry: false,
  });
};
