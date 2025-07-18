'use client';
import { SignUpForm } from '@eshopper/client-auth/client';
import { useSignup } from '../../hooks/useSignup';

export function SignUpView() {
  return <SignUpForm useMutation={useSignup} />;
}
