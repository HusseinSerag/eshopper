import { OnBoardingView } from '@/modules/onboarding/ui/views/onboarding-view';
import { axiosClient } from '@/utils/axios';
import { ProtectedServerComponent } from '@/utils/protectedComponent';
import { prefetchAuthenticatedQuery } from '@eshopper/client-auth/server';
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
      Component={async ({ freshTokens }) => {
        const queryClient = new QueryClient();
        await prefetchAuthenticatedQuery(
          axiosClient,
          ['onboarding-info'],
          '/auth/seller/onboarding-info',
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
        return (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <OnBoardingView />
          </HydrationBoundary>
        );
      }}
    />
  );
}
