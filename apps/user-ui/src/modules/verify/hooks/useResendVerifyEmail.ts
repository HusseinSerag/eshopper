import { useAuthenticatedMutation } from '@eshopper/client-auth/client';
import { useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

export function useResendVerificationEmail() {
  const queryClient = useQueryClient();
  const mutation = useAuthenticatedMutation<{ message: string }>(
    {
      url: '/auth/resend-verification-email',
      method: 'post',
    },
    {
      onSuccess(data) {
        queryClient.invalidateQueries({
          queryKey: ['protected', 'verification'],
        });
        toast.success(data.message);
      },
      async onError(error) {
        toast(error.message);
      },
    }
  );
  return mutation;
}
