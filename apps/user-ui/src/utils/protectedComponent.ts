import { createProtectedComponent } from '@eshopper/client-auth/server';

export const ProtectedServerComponent = createProtectedComponent({
  redirectUrls: {
    blocked: '/blocked',
    signIn: '/auth/sign-in',
    verify: '/auth/verify',
  },
});
