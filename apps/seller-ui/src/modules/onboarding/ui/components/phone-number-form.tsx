'use client';
import { useAuthenticatedQuery, useSeller } from '@eshopper/client-auth/client';
import { EnterPhoneNumber } from './enter-phone-number';
import { PhoneNumberVerificationInfo } from '@eshopper/shared-types';
import { useState, useEffect } from 'react';
import { useRequestPhoneNumber } from '../../hooks/useRequestPhoneNumber';
import { PhoneNumberConfirmOTP } from './phone-number-confirm-otp';
import { Button } from '@eshopper/ui';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  goToNextOnboardingStep: () => void;
}
export function PhoneNumberForm({ goToNextOnboardingStep }: Props) {
  const queryClient = useQueryClient();
  const { data } = useAuthenticatedQuery<{ data: PhoneNumberVerificationInfo }>(
    ['phone-number-verification-info'],
    '/auth/seller/phone-verification-info'
  );

  const { user } = useSeller();
  // Use localStorage for phoneNumber
  const [phoneNumber, setPhoneNumberState] = useState('');
  useEffect(() => {
    const stored = window.localStorage.getItem('phoneNumber');
    if (stored) {
      setPhoneNumberState(stored);
    } else if (data?.data.number) {
      setPhoneNumberState(data.data.number);
      window.localStorage.setItem('phoneNumber', data.data.number);
    }
  }, [data?.data.number]);
  const [step, setStep] = useState(1);

  useEffect(
    function () {
      if (phoneNumber) {
        window.localStorage.setItem('phoneNumber', phoneNumber);
      } else {
        window.localStorage.removeItem('phoneNumber');
      }
    },
    [phoneNumber]
  );
  const setPhoneNumber = (num: string) => {
    setPhoneNumberState(num);
  };

  const { mutate, isPending } = useRequestPhoneNumber();
  const isLoading = isPending;

  function onSendRequest(data: { phone_number: string }) {
    if (!isPending) {
      mutate(data, {
        onSuccess() {
          setPhoneNumber(data.phone_number);
          setStep(step + 1);
        },
      });
    }
  }

  // return (
  //   <div>
  //     <Button onClick={() => queryClient.invalidateQueries()}>test</Button>
  //   </div>
  // );
  if (user?.user?.seller?.isPhoneVerified) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Step 3: You have already added your phone number
        </h2>
        <Button onClick={goToNextOnboardingStep}>Next Step</Button>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div>
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold mb-4">
            Step 3: Add your phone number
          </h2>
          {phoneNumber && (
            <Button
              onClick={() => setStep(step + 1)}
              variant={'outline'}
              size={'sm'}
            >
              continue verifying
            </Button>
          )}
        </div>
        <EnterPhoneNumber
          key={phoneNumber}
          phone_number={phoneNumber}
          isLoading={isLoading}
          onSubmit={onSendRequest}
        />
      </div>
    );
  }
  if (step === 2)
    return (
      <div>
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold mb-4">
            Step 3: Confirm your phone number
          </h2>
          <Button
            onClick={() => setStep(step - 1)}
            variant={'outline'}
            size={'sm'}
          >
            Edit Number
          </Button>
        </div>
        <PhoneNumberConfirmOTP phoneNumber={phoneNumber} />
      </div>
    );
  return null;
}
