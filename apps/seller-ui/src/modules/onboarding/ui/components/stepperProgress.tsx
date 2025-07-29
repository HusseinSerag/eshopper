import { cn } from '@eshopper/ui';
import * as React from 'react';
interface StepperProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function StepperProgress({
  currentStep,
  totalSteps,
}: StepperProgressProps) {
  let messages: Iterable<string> = [
    'Verify Email',
    'Create Shop',
    'Add Phone number',
    'Connect Bank',
  ];
  const steps = Array.from(messages, (msg, i) => ({ step: i + 1, text: msg }));

  return (
    <div className="grid grid-rows-2">
      <div className="flex items-center">
        {steps.map(({ step, text }, index) => (
          <div className="flex relative items-center" key={step}>
            {/* Step Circle */}
            <div className="flex  justify-center items-center flex-col">
              <h3 className="text-xs absolute font-medium text-center top-[2rem] ">
                {text}
              </h3>
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
            </div>
            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className={'relative w-8 sm:w-14 h-1 mx-2'}>
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
    </div>
  );
}
