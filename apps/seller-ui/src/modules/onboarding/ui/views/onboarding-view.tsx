'use client';

import { useAuth, useAuthenticatedQuery } from '@eshopper/client-auth/client';
import { Card, Loader } from '@eshopper/ui';
import { cn } from '@eshopper/ui';
import { VerifyEmailView } from './verify-email-view';

export function OnBoardingView() {
  const { data } = useAuthenticatedQuery<{ onboardingStep: number }>(
    ['onboarding-info'],
    '/auth/seller/onboarding-info'
  );
  const { isLoading } = useAuth();

  if (!data || isLoading) return <Loader />;

  return (
    <div className="flex px-4 gap-8 py-8 min-h-svh flex-col items-center justify-center">
      <div className="flex">
        <StepperProgress currentStep={data.onboardingStep} totalSteps={3} />
      </div>
      <Card className="max-w-md border-2 w-full">
        <Component step={data.onboardingStep} />
      </Card>
    </div>
  );
}

interface StepperProgressProps {
  currentStep: number;
  totalSteps: number;
}

function StepperProgress({ currentStep, totalSteps }: StepperProgressProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="flex items-center">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          {/* Step Circle */}
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ease-in-out',
              step <= currentStep
                ? 'bg-blue-600 text-white shadow-lg transform scale-110'
                : 'bg-gray-200 text-gray-600'
            )}
          >
            {step <= currentStep ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              step
            )}
          </div>

          {/* Connecting Line */}
          {index < steps.length - 1 && (
            <div className="relative w-16 h-1 mx-2">
              {/* Background line */}
              <div className="absolute inset-0 bg-gray-200 rounded-full" />
              {/* Progress line */}
              <div
                className={cn(
                  'absolute inset-0 bg-blue-600 rounded-full transition-all duration-700 ease-in-out',
                  step < currentStep ? 'w-full' : 'w-0'
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface Props {
  step: number;
}

export function Component({ step }: Props) {
  const { user } = useAuth();
  if (step === 1) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Step 1: Verify your Email
        </h2>
        <VerifyEmailView />
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Step 2: Verification</h2>
        <p className="text-gray-600">Verify your business documents.</p>
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
