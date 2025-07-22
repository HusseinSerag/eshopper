import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Loader,
  PhoneInput,
  useCountdown,
  useCountry,
} from '@eshopper/ui';
import { CountryCode } from 'libphonenumber-js';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { EnterPhoneNumberSchema } from '../../schema/onboarding.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthenticatedQuery } from '@eshopper/client-auth/client';
import { PhoneNumberVerificationInfo } from '@eshopper/shared-types';

interface Props {
  isLoading: boolean;
  onSubmit: (values: { phone_number: string }) => void;
  phone_number: string;
}
export function EnterPhoneNumber({
  isLoading,
  onSubmit: mutate,
  phone_number,
}: Props) {
  const { countryCode, isLoading: isPending } = useCountry();
  const form = useForm<z.infer<typeof EnterPhoneNumberSchema>>({
    resolver: zodResolver(EnterPhoneNumberSchema),
    defaultValues: {
      phone_number,
    },
  });
  const {
    data,
    isPending: isLoadingPhoneInfo,
    isError,
  } = useAuthenticatedQuery<{ data: PhoneNumberVerificationInfo }>(
    ['phone-number-verification-info'],
    '/auth/seller/phone-verification-info'
  );

  if (isPending || isLoadingPhoneInfo) {
    return <Loader />;
  }
  if (isError) return null;
  const cooldown = data.data.userCooldown;
  function onSubmit(values: z.infer<typeof EnterPhoneNumberSchema>) {
    if (isLoading || cooldown > 0) return;
    mutate(values);
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <PhoneInput
                  {...field}
                  defaultCountry={countryCode as CountryCode}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          {cooldown > 0 ? (
            <Cooldown cooldown={cooldown} />
          ) : (
            <Button disabled={isLoading}>Send OTP</Button>
          )}
        </div>
      </form>
    </Form>
  );
}

function Cooldown({ cooldown }: { cooldown: number }) {
  const { hours, minutes, seconds } = useCountdown(cooldown);
  return (
    <div className="font-semibold text-sm">
      {hours}:{minutes}:{seconds}
    </div>
  );
}
