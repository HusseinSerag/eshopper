import { useAuth } from '@eshopper/client-auth/client';
import { useState } from 'react';
import { VerifyEmailView } from '../views/verify-email-view';
import { Button } from '@eshopper/ui';

interface Props {
  step: number;
  setSteps(steps: number): void;
}

export function StepComponent({ step, setSteps }: Props) {
  const { user } = useAuth();
  const isEmailVerified = user?.user?.emailOwnership.every(
    (email) => email.isVerified
  );

  if (step === 1) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {!isEmailVerified
            ? 'Step 1: Verify your Email'
            : 'Email Already Verified'}
        </h2>
        {!isEmailVerified && <VerifyEmailView />}
        {isEmailVerified && (
          <Button variant="outline" onClick={() => setSteps(++step)}>
            Next
          </Button>
        )}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Step 2: Verification</h2>
        <p className="text-gray-600">Verify your business documents.</p>
        <Button onClick={() => setSteps(--step)}>Next</Button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Step 3: Setup Complete</h2>
        <p className="text-gray-600">Your account is ready to go!</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <p className="text-red-600">Invalid step</p>
    </div>
  );
}
