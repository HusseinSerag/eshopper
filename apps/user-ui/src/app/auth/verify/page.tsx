import { VerifyEmailView } from '@/modules/verify/ui/views/verify-email-view';
import { axiosClient } from '@/utils/axios';
import { prefetchAuthenticatedQuery } from '@eshopper/client-auth/server';
import { ProtectedServerComponent } from '@/utils/protectedComponent';
import { hasVerifiedEmail } from '@eshopper/shared-types';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { redirect } from 'next/navigation';

export default async function VerificationPage() {
  return (
    <ProtectedServerComponent
      redirection={{
        onBlocked: true,
        onInverification: false,
      }}
      Component={async ({ user, freshTokens, queryClient }) => {
        user = user!;
        if (hasVerifiedEmail(user)) {
          redirect('/');
        }

        await prefetchAuthenticatedQuery(
          axiosClient,
          ['verification'],
          '/auth/verification-info',
          freshTokens,
          queryClient
        );
        return (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <VerifyEmailView />
          </HydrationBoundary>
        );
      }}
    />
  );
}
