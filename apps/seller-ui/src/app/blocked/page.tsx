import { BlockedView } from '@eshopper/client-auth/client';
import { axiosClient } from '@/utils/axios';
import { prefetchAuthenticatedQuery } from '@eshopper/client-auth/server';
import { ProtectedServerComponent } from '@/utils/protectedComponent';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function BlockedPage() {
  return (
    <ProtectedServerComponent
      axiosClient={axiosClient}
      redirection={{
        onBlocked: false,
        onInverification: true,
      }}
      Component={async ({ user, freshTokens }) => {
        const queryClient = await prefetchAuthenticatedQuery(
          axiosClient,
          ['blocked-info'],
          '/auth/blocked-info',
          freshTokens
        );
        return (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <BlockedView />
          </HydrationBoundary>
        );
      }}
    />
  );
}
