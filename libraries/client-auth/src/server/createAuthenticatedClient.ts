import { AxiosClient } from '@eshopper/utils/client';
import { AuthenticateHttpClient } from '../lib/client-auth';

export type HttpClientContext = {
  refreshed: boolean;
};

export function createAuthenticatedClient(
  axiosInstance: AxiosClient,
  refreshUrl: string
): {
  client: AuthenticateHttpClient;
  context: HttpClientContext;
} {
  const context: HttpClientContext = { refreshed: false };

  const client = new AuthenticateHttpClient(axiosInstance, refreshUrl);

  client.onRefresh(() => {
    context.refreshed = true;
  });

  return { client, context };
}
