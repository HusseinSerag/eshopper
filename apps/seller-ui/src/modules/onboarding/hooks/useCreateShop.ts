import { useAuthenticatedMutation } from '@eshopper/client-auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { CreateShop } from '../types';

export function useCreateShop() {
  const queryClient = useQueryClient();

  const verifyMutation = useAuthenticatedMutation<unknown, CreateShop>(
    {
      method: 'post',
      url: `/shop`,
    },
    {
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: ['protected', 'onboarding-info'],
        });
        await queryClient.invalidateQueries({
          queryKey: ['protected', 'shop-info'],
        });
      },
      async onError(error) {
        toast(error.message);
      },
    }
  );
  return verifyMutation;
}
