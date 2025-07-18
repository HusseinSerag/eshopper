'use client';

import { SignInForm } from '@eshopper/client-auth/client';
import { useSendPasswordRequest } from '../../hooks/useSendPasswordRequest';

export function SignInView() {
  return <SignInForm useMutation={useSendPasswordRequest} />;
}
