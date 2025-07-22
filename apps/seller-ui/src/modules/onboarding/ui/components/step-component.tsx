import { useAuth } from '@eshopper/client-auth/client';
import { VerifyEmailView } from '../views/verify-email-view';
import { Button } from '@eshopper/ui';

import { SellerFormWrapper } from './seller-form-wrapper';
import { PhoneNumberForm } from './phone-number-form';
import { ConnectToStripeButton } from './ConnectToStripeButton';

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
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">
          Step 1: Verify your Email
        </h2>
        {!isEmailVerified && <VerifyEmailView />}
        {isEmailVerified && (
          <div className="flex gap-2 flex-col ">
            <h2 className="text-sm font-semibold">
              Your email is already verified, please proceed with the next step
            </h2>
            <Button
              className="self-start"
              variant="outline"
              onClick={() => setSteps(step + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="p-4">
        <SellerFormWrapper currentSteps={step} setSteps={setSteps} />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="p-4 flex flex-col gap-2">
        <PhoneNumberForm goToNextOnboardingStep={() => setSteps(step + 1)} />

        <Button onClick={() => setSteps(step - 1)}>back to editing shop</Button>
      </div>
    );
  }

  if (step === 4)
    return (
      <div className="p-4">
        <h2 className="font-semibold mb-4 text-xl">
          Step 4: Connect to Stripe
        </h2>
        <div className="grid gap-y-2 place-items-start">
          <ConnectToStripeButton />
          <p className="text-sm font-medium">
            * You need to fill in all billing info to be paid
          </p>
        </div>
      </div>
    );
}
