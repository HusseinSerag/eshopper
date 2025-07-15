import { getAuthClient } from '@eshopper/client-auth';
import { useAuthContext } from '@eshopper/client-auth/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authContext = useAuthContext();
  const mutation = useMutation<
    void,
    Error,
    {
      name: string;
      email: string;
      password: string;
    }
  >({
    async mutationFn(data) {
      const client = authContext.httpClient;
      try {
        await client.request({
          url: '/auth/register',
          body: JSON.stringify(data),
          method: 'post',
          headers: {
            'Content-type': 'application/json',
          },
        });
      } catch (e) {
        const error = e as { code: number; message: string };
        if (error.code !== 500) {
          throw new Error(error.message);
        }
        throw new Error('Unknown Error, please try again later');
      }
    },
    async onSuccess() {
      toast.success('Successfully registered');
      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      router.push('/auth/verify');
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return mutation;
}
