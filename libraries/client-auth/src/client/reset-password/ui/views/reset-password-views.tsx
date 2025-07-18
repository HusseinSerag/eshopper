'use client';

import {
  Button,
  Card,
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@eshopper/ui';

import { useForm } from 'react-hook-form';
import z from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { UseMutationResult } from '@tanstack/react-query';
import { NewPasswordSchema } from '../../../schemas';

interface ResetPasswordViewProps {
  useMutation: () => UseMutationResult<
    unknown,
    Error,
    {
      password: string;
      logOutAllDevices: boolean;
    },
    unknown
  >;
  redirectUrl: string;
}
export function ResetPasswordView({
  redirectUrl,
  useMutation,
}: ResetPasswordViewProps) {
  //const sendPassword = useSendNewPasswordRequest();
  const sendPassword = useMutation();
  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      logOutAllDevices: false,
      password: '',
    },
  });

  const router = useRouter();
  const disabled = sendPassword.isPending;
  function onSubmit(values: z.infer<typeof NewPasswordSchema>) {
    if (disabled) return;
    sendPassword.mutate(values, {
      onError(error) {
        toast.error(error.message);
      },
      onSuccess() {
        toast('Password successfully changed');
        router.push(redirectUrl);
      },
    });
  }
  return (
    <Card className="px-4 py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logOutAllDevices"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Log out all devices</FormLabel>
                  <FormDescription>
                    This will sign you out of all devices where you're currently
                    logged in.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <Button disabled={disabled} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    </Card>
  );
}
