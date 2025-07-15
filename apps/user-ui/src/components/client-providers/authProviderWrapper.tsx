'use client';

import { axiosClient } from '@/utils/axios';
import { AuthContextProvider, getAuthClient } from '@eshopper/client-auth';
import { useQueryClient } from '@tanstack/react-query';

export function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const httpClient = getAuthClient(axiosClient);
  httpClient.onUnauthenticatedRequest = () => {
    queryClient.setQueryData(['auth', 'user'], null);
  };
  return (
    <AuthContextProvider client={httpClient}>{children}</AuthContextProvider>
  );
}
