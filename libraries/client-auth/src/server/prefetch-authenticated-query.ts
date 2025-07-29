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

  const headerObj: Record<string, string> = {};
  headersList.forEach((value, key) => {
    headerObj[key] = value;
  });

  void queryClient.prefetchQuery({
    queryKey: ['protected', ...queryKey],
    queryFn: async () => {
      const requestId = crypto.randomUUID();
      console.log(`X-Request-Id:${requestId}`);
      return authClient.request({
        url,
        method: 'get',
        headers: {
          'Content-type': 'application/json',
          ...headerObj,
          ...passedHeaders,
          cookie: cookieHeader,
          'X-Request-Id': requestId,
        },
      });
    },
    staleTime: Infinity,
    gcTime: Infinity,
    ...options,
  });
  return queryClient;
}
