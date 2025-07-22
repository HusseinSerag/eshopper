import { useAuthenticatedMutation } from '@eshopper/client-auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useConfirmPhoneNumber() {
  const queryClient = useQueryClient();

  const verifyMutation = useAuthenticatedMutation<
    unknown,
    { phone_number: string; otp: string }
  >(
    {
      method: 'post',
      url: `/auth/seller/confirm-phone-otp`,
    },
    {
      async onSuccess() {
        toast('Phone number confirmed');
        await queryClient.invalidateQueries({
          queryKey: ['protected', 'phone-number-verification-info'],
        });
        await queryClient.invalidateQueries({
          queryKey: ['protected', 'onboarding-info'],
        });
      },
      async onError(error) {
        await queryClient.invalidateQueries({
          queryKey: ['protected', 'phone-number-verification-info'],
        });

        toast(error.message);
      },
    }
  );
  return verifyMutation;
}
