'use client';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthenticatedMutation } from './useAuthenticationMutation';
import { useRouter } from 'next/navigation';

export const useLogout = (logoutAll = false) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const url = logoutAll ? '/auth/logout-all' : '/auth/logout';

  return useAuthenticatedMutation(
    {
      url,
      method: 'post',
    },
    {
      onSuccess: () => {
        router.push('/auth/sign-in');
        queryClient.removeQueries({
          predicate: (query) => query.queryKey[0] === 'protected',
        });
        queryClient.removeQueries({
          queryKey: ['auth', 'user'],
        });

        // await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      },
    }
  );
};
