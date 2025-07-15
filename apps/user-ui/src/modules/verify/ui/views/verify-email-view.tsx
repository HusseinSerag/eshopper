'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { useVerify } from '../../hooks/useVerify';
import { VerificationInformation } from '../components/verification-information';
import { useResendVerificationEmail } from '../../hooks/useResendVerifyEmail';

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: 'Your one-time password must be 6 characters.',
  }),
});

export function VerifyEmailView() {
  // see if we either
  const verifyMutation = useVerify();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: '',
    },
  });
  const resendEmail = useResendVerificationEmail();

  const isPending = verifyMutation.isPending || resendEmail.isPending;
  function onResendEmail() {
    if (isPending) return;
    resendEmail.mutate(
      {},
      {
        onSettled() {
          form.clearErrors('pin');
        },
      }
    );
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!isPending)
      verifyMutation.mutate(
        { otp: data.pin },
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
    <div className="px-4 py-8  flex items-center justify-center">
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
                <FormLabel>Email Verification</FormLabel>
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
                  Please enter the one-time password sent to your email.
                </FormDescription>

                <FormMessage />

                <VerificationInformation onResend={onResendEmail} />
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
