import { useAuthContext } from '@eshopper/client-auth/client';
import { useMutation } from '@tanstack/react-query';

export function useSendPasswordRequest() {
  const context = useAuthContext();
  const mutation = useMutation({
    mutationFn: async () => {
      return await context.httpClient.request({
        url: '/auth/reset-password-request',
        method: 'post',
      });
    },
  });

  return mutation;
}
