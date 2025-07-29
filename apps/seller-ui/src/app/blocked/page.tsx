import { BlockedView } from '@eshopper/ui';
import { axiosClient } from '@/utils/axios';
import { prefetchAuthenticatedQuery } from '@eshopper/client-auth/server';
import { ProtectedServerComponent } from '@/utils/protectedComponent';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function BlockedPage() {
  return (
    <ProtectedServerComponent
      redirection={{
        onBlocked: false,
        onInverification: true,
      }}
      Component={async ({ user, freshTokens, queryClient }) => {
        await prefetchAuthenticatedQuery(
          axiosClient,
          ['blocked-info'],
          '/auth/seller/blocked-info',
          freshTokens,
          queryClient
        );
        return (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <BlockedView isSeller />
          </HydrationBoundary>
        );
      }}
    />
  );
}
