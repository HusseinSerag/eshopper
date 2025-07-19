import { useAuthenticatedMutation } from '@eshopper/client-auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useVerify() {
  const queryClient = useQueryClient();

  const verifyMutation = useAuthenticatedMutation<unknown, { otp: string }>(
    {
      method: 'post',
      url: `/auth/seller/verify-email`,
    },
    {
      async onSuccess() {
        toast('Verification successful');
        await queryClient.invalidateQueries({
          queryKey: ['protected', 'onboarding-info'],
        });
      },
      async onError(error) {
        await queryClient.invalidateQueries({
          queryKey: ['protected', 'verification'],
        });

        toast(error.message);
      },
    }
  );
  return verifyMutation;
}
