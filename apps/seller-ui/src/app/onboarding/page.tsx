import { PageSkeleton } from '@/modules/onboarding/ui/components/page-skeleton';
import { OnBoardingView } from '@/modules/onboarding/ui/views/onboarding-view';
import { axiosClient } from '@/utils/axios';

import { ProtectedServerComponent } from '@/utils/protectedComponent';
import {
  prefetchAuthenticatedQuery,
  prefetchQuery,
} from '@eshopper/client-auth/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default function OnboardingPage() {
  return (
    <ProtectedServerComponent
      currentUrl="/onboarding"
      redirection={{
        onBlocked: true,
        onInverification: false,
      }}
      Component={async ({ freshTokens, user, queryClient }) => {
        const finishedOnboarding =
          user &&
          user.emailOwnership.every((email) => email.isVerified) &&
          user.seller &&
          user.seller.isPhoneVerified &&
          user.seller.stripeId &&
          user.seller.isOnboarded;
        if (finishedOnboarding) {
          redirect('/');
          return;
        }

        await prefetchAuthenticatedQuery(
          axiosClient,
          ['onboarding-info'],
          '/shop/onboarding-info',
          freshTokens,
          queryClient
        );
        await prefetchAuthenticatedQuery(
          axiosClient,
          ['verification'],
          '/auth/seller/verification-info',
          freshTokens,
          queryClient
        );
        await prefetchAuthenticatedQuery(
          axiosClient,
          ['shop-info'],
          '/shop',
          freshTokens,
          queryClient
        );

        await prefetchAuthenticatedQuery(
          axiosClient,
          ['phone-number-verification-info'],
          '/auth/seller/phone-verification-info',
          freshTokens,
          queryClient
        );
        await prefetchQuery(
          axiosClient,
          ['categories'],
          '/shop/categories',
          queryClient
        );

        return (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<PageSkeleton />}>
              <OnBoardingView />
            </Suspense>
          </HydrationBoundary>
        );
      }}
    />
  );
}
