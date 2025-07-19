'use client';
import { SignUpForm } from '@eshopper/ui';
import { useSignup } from '../../hooks/useSignup';

export function SignUpView() {
  return <SignUpForm useMutation={useSignup} />;
}
