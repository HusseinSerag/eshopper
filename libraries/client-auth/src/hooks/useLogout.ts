'use client';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthenticatedMutation } from './useAuthenticationMutation';
import { useRouter } from 'next/navigation';

export const useLogout = ({ isSeller }: { isSeller: boolean }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const url = isSeller ? '/auth/seller/logout' : '/auth/logout';

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
      },
    }
  );
};
