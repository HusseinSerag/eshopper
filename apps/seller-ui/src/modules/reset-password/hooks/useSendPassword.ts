'use client';
import {
  NewPasswordSchema,
  useAuthContext,
} from '@eshopper/client-auth/client';
import { useMutation } from '@tanstack/react-query';
import z from 'zod';

import { useSearchParams } from 'next/navigation';

export function useSendNewPasswordRequest() {
  const context = useAuthContext();
  const params = useSearchParams();
  const token = params.get('token');

  const mutation = useMutation<
    unknown,
    Error,
    z.infer<typeof NewPasswordSchema>
  >({
    mutationFn: async (body) => {
      const passedParams = new URLSearchParams();
      if (!token) throw Error('No token');
      passedParams.set('token', token);
      return await context.httpClient.request({
        url: '/auth/seller/reset-password?' + passedParams.toString(),
        method: 'post',
        body: body,
      });
    },
    retry: false,
  });

  return mutation;
}
