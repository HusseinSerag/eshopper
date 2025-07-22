'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuthenticatedQuery } from '@eshopper/client-auth/client';
import { PhoneNumberVerificationInfo } from '@eshopper/shared-types';
import { VerificationInfoComponent } from '@eshopper/ui';
import { useConfirmPhoneNumber } from '../../hooks/useConfirmPhoneNumber';

import { Button } from '@eshopper/ui';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@eshopper/ui';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@eshopper/ui';
import { useRequestPhoneNumber } from '../../hooks/useRequestPhoneNumber';

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: 'Your one-time password must be 6 characters.',
  }),
});

interface PhoneNumberConfirmOTPProps {
  phoneNumber: string;
}
export function PhoneNumberConfirmOTP({
  phoneNumber,
}: PhoneNumberConfirmOTPProps) {
  // see if we either

  const confirmPhoneNumber = useConfirmPhoneNumber();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: '',
    },
  });
  const requestPhoneNumber = useRequestPhoneNumber();
  const isPending =
    requestPhoneNumber.isPending || confirmPhoneNumber.isPending;
  function onResendOTP() {
    if (isPending) return;
    requestPhoneNumber.mutate(
      {
        phone_number: phoneNumber,
      },
      {
        onSettled() {
          form.clearErrors('pin');
        },
      }
    );
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!isPending)
      confirmPhoneNumber.mutate(
        { otp: data.pin, phone_number: phoneNumber },
        {
          onError(error) {
            form.setError('pin', {
              message: error.message,
            });
          },
        }
      );
  }

  return (
    <div className="  flex items-center justify-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-[90%] space-y-6"
        >
          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number Verification</FormLabel>
                <FormControl>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot
                        className=" sm-w-12 sm-h-12 w-8 h-8"
                        index={0}
                      />
                      <InputOTPSlot
                        className="sm-w-12 sm-h-12 w-8 h-8"
                        index={1}
                      />
                      <InputOTPSlot
                        className="sm-w-12 sm-h-12 w-8 h-8"
                        index={2}
                      />
                      <InputOTPSlot
                        className="sm-w-12 sm-h-12 w-8 h-8"
                        index={3}
                      />
                      <InputOTPSlot
                        index={4}
                        className="sm-w-12 sm-h-12 w-8 h-8"
                      />
                      <InputOTPSlot
                        className="sm-w-12 sm-h-12 w-8 h-8"
                        index={5}
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormDescription>
                  Please enter the one-time password sent to {phoneNumber}.
                </FormDescription>

                <FormMessage />

                <VerificationInformation onResend={onResendOTP} />
              </FormItem>
            )}
          />

          <Button disabled={isPending} type="submit">
            Verify
          </Button>
        </form>
      </Form>
    </div>
  );
}

export function VerificationInformation({ onResend }: { onResend(): void }) {
  const { data } = useAuthenticatedQuery<{ data: PhoneNumberVerificationInfo }>(
    ['phone-number-verification-info'],
    '/auth/seller/phone-verification-info'
  );
  if (!data?.data) return null;
  const {
    maxRequest,

    tries,
    numberOfRequestsPerWindow,

    windowForRequests,
    maxTries,
  } = data.data;
  return (
    <VerificationInfoComponent
      title="SMS"
      onResend={onResend}
      data={{
        invalidOtpCount: tries,
        cooldown: Math.max(data.data.numberCooldown, data.data.userCooldown),
        maxInvalidOTP: maxTries,
        maxResendRequests: maxRequest,
        newRequestWindow: windowForRequests,
        numberOfRequestsPerWindow: numberOfRequestsPerWindow,
      }}
    />
  );
}
//maxResendRequests <= data.numberOfRequestsPerWindow
