'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { SignUpSchema } from '../../schemas/sign-up.schema';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form';
import { getGoogleLink } from '@eshopper/client-auth';

import { Input } from '../../../../components/ui/input';

import { FaGoogle } from 'react-icons/fa';
import Link from 'next/link';

import { useState } from 'react';

import { useSearchParams } from 'next/navigation';

import type { UseMutationResult } from '@tanstack/react-query';
import { useAuthContext } from '@eshopper/client-auth/client';
import { OAuthErrorAlert } from '../../../../components/ui/oauth-error-alert';
import { Button } from '../../../../components/ui/button';
import { ProviderButton } from '../../../../components/ui/provider-button';

interface SignUpFormProps {
  useMutation: () => UseMutationResult<
    void,
    Error,
    {
      name: string;
      email: string;
      password: string;
    },
    unknown
  >;
}
export function SignUpForm({ useMutation }: SignUpFormProps) {
  const params = useSearchParams();
  const error = params.get('error');

  const authContext = useAuthContext();
  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      confirmPassword: '',
      email: '',
      name: '',
      password: '',
    },
  });
  const signupMutation = useMutation();
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);

  const disabled = isLoadingProvider || signupMutation.isPending;
  function onSubmit(values: z.infer<typeof SignUpSchema>) {
    if (disabled) return;
    signupMutation.mutate(values);
  }

  async function getGoogleSignupLink() {
    setIsLoadingProvider(true);
    try {
      const data = await getGoogleLink(authContext.httpClient, 'signup');
      // @ts-expect-error this works in client
      window.location.href = data;
    } catch (error) {
      console.error('Error getting Google OAuth link:', error);
      // You could show a toast notification here
      // For now, we'll just log the error
    } finally {
      setIsLoadingProvider(false);
    }
  }

  return (
    <div className=" w-full">
      <Form {...form}>
        <form
          className="flex flex-col py-8 px-4 "
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2 sm:gap-4">
            <div className="text-center">
              <h1 className="font-semibold text-2xl">Welcome to Eshopper</h1>
              <h2 className="text-medium text-sm">Please create an account</h2>
            </div>
            <OAuthErrorAlert errorCode={error} onRetry={getGoogleSignupLink} />
            <div className="flex flex-col gap-2 ">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="please enter your password..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="please confirm your password..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-4">
                <Button disabled={disabled} className="w-full" type="submit">
                  Sign up
                </Button>
                <div className="flex items-center my-2 gap-1">
                  <span className="h-[3px] w-full my-2 bg-muted"></span>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    or Continue with
                  </span>
                  <span className="h-[3px] w-full my-2 bg-muted"></span>
                </div>

                <ProviderButton
                  text="Signup with Google"
                  icon={<FaGoogle />}
                  onClick={getGoogleSignupLink}
                  disabled={disabled}
                />
              </div>

              <div className="mt-2 text-center text-sm">
                <span className="font-semibold">Already have an account? </span>
                <Link
                  className="text-blue-500 underline"
                  href={'/auth/sign-in'}
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
