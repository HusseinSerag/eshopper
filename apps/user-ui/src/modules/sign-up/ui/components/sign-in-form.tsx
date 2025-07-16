import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { SignInSchema } from '../../schemas/sign-in.schema';
import { Button, Dialog, DialogTrigger } from '@eshopper/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@eshopper/ui';
import { Input } from '@eshopper/ui';
import { ProviderButton } from '@/components/ui/provider-button';
import { OAuthErrorAlert } from '@/components/ui/oauth-error-alert';
import { FaGoogle } from 'react-icons/fa';
import Link from 'next/link';

import { useAuthContext, useLogin } from '@eshopper/client-auth/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { getGoogleLink } from '@/modules/sign-in/server';
import { ResetPasswordForm } from './reset-email-form';

export function SignInForm() {
  const params = useSearchParams();
  const error = params.get('error');

  const authContext = useAuthContext();
  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',

      password: '',
    },
  });
  const loginMutation = useLogin();
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);
  const disabled = isLoadingProvider || loginMutation.isPending;
  const router = useRouter();
  function onSubmit(values: z.infer<typeof SignInSchema>) {
    if (disabled) return;
    loginMutation.mutate(values, {
      onError(error) {
        toast.error(error.message);
      },
      onSuccess() {
        toast.success('Logged in successfully!');
        router.push('/');
      },
    });
  }

  async function getGoogleSignupLink() {
    setIsLoadingProvider(true);
    try {
      const data = await getGoogleLink(authContext.httpClient, 'login');
      window.location.href = data;
    } catch (error) {
      toast.error('Error getting link');
    } finally {
      setIsLoadingProvider(false);
    }
  }

  return (
    <Dialog>
      <ResetPasswordForm />

      <div className=" w-full">
        <Form {...form}>
          <form
            className="flex flex-col py-8 px-4 "
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-2 sm:gap-4">
              <div className="text-center">
                <h1 className="font-semibold text-2xl">Welcome to Eshopper</h1>
                <h2 className="text-medium text-sm">
                  Please create an account
                </h2>
              </div>
              <OAuthErrorAlert
                errorCode={error}
                onRetry={getGoogleSignupLink}
              />
              <div className="flex flex-col gap-2 ">
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

                <div className="mt-4">
                  <Button disabled={disabled} className="w-full" type="submit">
                    Login
                  </Button>
                  <div className="flex items-center my-2 gap-1">
                    <span className="h-[3px] w-full my-2 bg-muted"></span>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      or Continue with
                    </span>
                    <span className="h-[3px] w-full my-2 bg-muted"></span>
                  </div>

                  <ProviderButton
                    text="Sign in with Google"
                    icon={<FaGoogle />}
                    onClick={getGoogleSignupLink}
                    disabled={disabled}
                  />
                </div>

                <DialogTrigger asChild>
                  <Button
                    variant={'link'}
                    className=" text-center text-sm font-semibold"
                  >
                    Forget your password?
                  </Button>
                </DialogTrigger>

                <div className="mt-2 text-center text-sm">
                  <span className="font-semibold">Don't have an account? </span>
                  <Link
                    className="text-blue-500 underline"
                    href={'/auth/sign-up'}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </Dialog>
  );
}
