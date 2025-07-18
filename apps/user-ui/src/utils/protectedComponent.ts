import { createProtectedComponent } from '@eshopper/client-auth/server';
import { ShopperUser } from '@eshopper/shared-types';

export const ProtectedServerComponent = createProtectedComponent<ShopperUser>({
  redirectUrls: {
    blocked: '/blocked',
    signIn: '/auth/sign-in',
    verify: '/auth/verify',
  },
});
