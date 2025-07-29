import { useAuthenticatedMutation } from '@eshopper/client-auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useConnectBank() {
  const queryClient = useQueryClient();

  const mutation = useAuthenticatedMutation<{ client_secret: string }>(
    {
      method: 'post',
      url: `/shop/create-stripe-link`,
    },
    {
      async onSuccess(data) {
        await queryClient.invalidateQueries({
          queryKey: ['auth', 'user'],
        });
      },
      async onError(error) {
        toast(error.message);
      },
    }
  );
  return mutation;
}
