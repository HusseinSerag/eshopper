import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../context/useAuthContext';
import { useAuthenticatedMutation } from './useAuthenticationMutation';

export const useLogout = (logoutAll = false) => {
  const authContext = useAuthContext();
  const queryClient = useQueryClient();
  const url =
    authContext.baseUrl + (logoutAll ? '/auth/logout-all' : '/auth/logout');

  return useAuthenticatedMutation(
    {
      url,
      method: 'POST',
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      },
    }
  );
};
