import { OnBoardingView } from '@/modules/onboarding/ui/views/onboarding-view';
import { axiosClient } from '@/utils/axios';
import { ProtectedServerComponent } from '@/utils/protectedComponent';
import {
  prefetchAuthenticatedQuery,
  prefetchQuery,
} from '@eshopper/client-auth/server';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

export default function OnboardingPage() {
  return (
    <ProtectedServerComponent
      currentUrl="/onboarding"
      redirection={{
        onBlocked: true,
        onInverification: false,
      }}
      Component={async ({ freshTokens, user }) => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(['auth', 'user'], {
          user,
          success: true,
        });

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
            <OnBoardingView />
          </HydrationBoundary>
        );
      }}
    />
  );
}
