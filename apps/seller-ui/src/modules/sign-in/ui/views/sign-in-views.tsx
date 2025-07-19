'use client';

import { SignInForm } from '@eshopper/ui';
import { useSendPasswordRequest } from '../../hooks/useSendPasswordRequest';

export function SignInView() {
  return <SignInForm useMutation={useSendPasswordRequest} />;
}
