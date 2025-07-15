import { useAuthenticatedMutation } from '@eshopper/client-auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useVerify() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const verifyMutation = useAuthenticatedMutation<unknown, { otp: string }>(
    {
      method: 'post',
      url: `/auth/verify-email`,
    },
    {
      onSuccess() {
        router.push('/');
        toast('Verification successful');
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
