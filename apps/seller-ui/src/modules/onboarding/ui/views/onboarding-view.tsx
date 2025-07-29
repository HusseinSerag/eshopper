'use client';

import { useAuthenticatedQuery, useSeller } from '@eshopper/client-auth/client';
import { Card, Loader } from '@eshopper/ui';

import { useEffect, useState } from 'react';
import { StepperProgress } from '../components/stepperProgress';
import { StepComponent } from '../components/step-component';

export function OnBoardingView() {
  const { data } = useAuthenticatedQuery<{ onboardingStep: number }>(
    ['onboarding-info'],
    '/shop/onboarding-info'
  );

  const { isLoading } = useSeller();

  if (isLoading)
    return (
      <div className="w-full min-h-svh flex items-center  justify-center">
        <Loader />
      </div>
    );

  if (!data) return;
  return <Component steps={data.onboardingStep} />;
}

function Component({ steps }: { steps: number }) {
  const [currentSteps, setCurrentSteps] = useState(steps);
  const setSteps = (steps: number) => {
    setCurrentSteps(steps);
  };
  useEffect(
    function () {
      if (steps >= 1 && steps <= 4) {
        setSteps(steps);
      } else {
        setSteps(4);
      }
    },
    [steps]
  );
  return (
    <div className="flex px-4 gap-8 py-8  flex-col items-center">
      <div className="flex items-center">
        <StepperProgress currentStep={currentSteps} totalSteps={4} />
      </div>
      <Card className="max-w-md border-2 w-full">
        <StepComponent setSteps={setSteps} step={currentSteps} />
      </Card>
    </div>
  );
}
