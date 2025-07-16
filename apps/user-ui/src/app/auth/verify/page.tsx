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
      axiosClient={axiosClient}
      redirection={{
        onBlocked: true,
        onInverification: false,
      }}
      Component={async ({ user, freshTokens }) => {
        user = user!;
        if (hasVerifiedEmail(user)) {
          redirect('/');
        }

        const queryClient = await prefetchAuthenticatedQuery(
          axiosClient,
          ['verification'],
          '/auth/verification-info',
          freshTokens
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
