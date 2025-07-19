import { QueryClient, QueryOptions } from '@tanstack/react-query';
import { getAuthClient } from '../';
import { cookies, headers } from 'next/headers';
import { AxiosClient } from '@eshopper/utils/client';

export async function prefetchAuthenticatedQuery(
  axiosClient: AxiosClient,
  queryKey: string[],
  url: string,
  freshTokens?: { accessToken: string; refreshToken: string },
  queryClient?: QueryClient,
  passedHeaders?: Record<string, any>,
  options?: QueryOptions
) {
  if (!queryClient) queryClient = new QueryClient();
  const authClient = getAuthClient(axiosClient);
  const headersList = await headers();
  let cookieHeader: string;
  if (freshTokens) {
    cookieHeader = `accessToken=${freshTokens.accessToken}; refreshToken=${freshTokens.refreshToken}`;
  } else {
    cookieHeader = (await cookies()).toString();
  }
  await queryClient.prefetchQuery({
    queryKey: ['protected', ...queryKey],
    queryFn: async () => {
      return authClient.request({
        url,
        method: 'get',
        headers: {
          'Content-type': 'application/json',
          ...Object.fromEntries(headersList.entries()),
          ...passedHeaders,
          cookie: cookieHeader,
        },
      });
    },
    ...options,
  });
  return queryClient;
}
