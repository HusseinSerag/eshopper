import { QueryClient, QueryOptions } from '@tanstack/react-query';
import { getAuthClient } from '../';
import { cookies, headers } from 'next/headers';
import { AxiosClient } from '@eshopper/utils/client';

export async function prefetchQuery(
  axiosClient: AxiosClient,
  queryKey: string[],
  url: string,

  queryClient?: QueryClient,
  passedHeaders?: Record<string, any>,
  options?: QueryOptions
) {
  if (!queryClient) queryClient = new QueryClient();
  const authClient = getAuthClient(axiosClient);
  const headersList = await headers();
  const cookieHeader = (await cookies()).toString();

  await queryClient.prefetchQuery({
    queryKey: [...queryKey],
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
