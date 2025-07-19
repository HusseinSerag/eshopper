import { createProtectedComponent } from '@eshopper/client-auth/server';
import { SellerUser } from '@eshopper/shared-types';
import { axiosClient } from './axios';

export const ProtectedServerComponent = createProtectedComponent<SellerUser>({
  redirectUrls: {
    blocked: '/blocked',
    signIn: '/auth/sign-in',
    verify: '/onboarding',
  },
  redirectOn: [
    {
      priority: 1,
      callback(user) {
        return user.emailOwnership.length === 3;
      },
      redirectTo: '/onboarding',
    },
  ],
  meLink: '/auth/seller/me',
  axiosClient: axiosClient,
});
