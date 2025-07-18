import { useAuthContext } from '@eshopper/client-auth/client';
import { useMutation } from '@tanstack/react-query';

export function useSendPasswordRequest() {
  const context = useAuthContext();
  const mutation = useMutation<{ message: string }, Error, string>({
    mutationFn: async (email: string) => {
      return (await context.httpClient.request({
        url: '/auth/reset-password-request',
        method: 'post',
        body: {
          email,
        },
      })) as { message: string };
    },
    retry: false,
  });

  return mutation;
}
