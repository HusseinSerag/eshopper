import { createProtectedComponent } from '@eshopper/client-auth/server';
import { ShopperUser } from '@eshopper/shared-types';
import { axiosClient } from './axios';

export const ProtectedServerComponent = createProtectedComponent<ShopperUser>({
  redirectUrls: {
    blocked: '/blocked',
    signIn: '/auth/sign-in',
    verify: '/auth/verify',
  },
  meLink: '/auth/me',
  axiosClient: axiosClient,
});
