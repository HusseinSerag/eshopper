import { useAuthenticatedMutation } from '@eshopper/client-auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useRequestPhoneNumber() {
  const queryClient = useQueryClient();

  const verifyMutation = useAuthenticatedMutation<
    unknown,
    { phone_number: string }
  >(
    {
      method: 'post',
      url: `/auth/seller/request-phone-otp`,
    },
    {
      async onSuccess() {
        toast('We have sent an SMS to your number!');
        await queryClient.invalidateQueries({
          queryKey: ['protected', 'phone-number-verification-info'],
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
