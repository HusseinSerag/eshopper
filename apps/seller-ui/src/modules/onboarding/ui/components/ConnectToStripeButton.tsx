import { Button, Loader, ScrollArea } from '@eshopper/ui';
import { FaStripeS } from 'react-icons/fa';
import { useConnectBank } from '../../hooks/useConnectBank';
import {
  loadConnectAndInitialize,
  StripeConnectInstance,
} from '@stripe/connect-js';
import { useState } from 'react';

import { useSeller } from '@eshopper/client-auth/client';

import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from '@stripe/react-connect-js';
import { toast } from 'sonner';
import { useFinishOnboarding } from '../../hooks/useFinishOnboarding';
import { useRouter } from 'next/navigation';
export function ConnectToStripeButton() {
  const { user } = useSeller();
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const connectBank = useConnectBank();
  const finishOnboarding = useFinishOnboarding();
  const router = useRouter();
  async function getClientSecret() {
    const { client_secret } = await connectBank.mutateAsync(
      {},
      {
        onError(error) {
          toast.error(error.message);
        },
      }
    );
    return client_secret;
  }
  const [stripeConnectInstance, setStripeConnectInstance] =
    useState<StripeConnectInstance | null>(() => {
      if (user.user?.seller?.stripeId) {
        return loadConnectAndInitialize({
          fetchClientSecret: getClientSecret,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        });
      } else return null;
    });

  function onClick() {
    const instance = loadConnectAndInitialize({
      fetchClientSecret: getClientSecret,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    });
    setStripeConnectInstance(instance);
  }
  if (success)
    return (
      <div className="w-full flex items-center text-sm font-medium justify-center h-full">
        Please wait till we redirect you to the dashboard
      </div>
    );
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center h-full">
        <Loader />
      </div>
    );
  }
  if (!stripeConnectInstance)
    return (
      <Button
        onClick={onClick}
        disabled={connectBank.isPending}
        className="bg-purple-900 hover:bg-purple-600"
      >
        <FaStripeS className="!size-4" />
        {user.user?.seller?.stripeId
          ? 'Start Onboarding process'
          : 'Connect to Stripe'}
      </Button>
    );
  if (stripeConnectInstance) {
    return (
      <div className="py-4 w-full">
        <ScrollArea className="h-96 w-full">
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding
              onExit={async () => {
                setStripeConnectInstance(null);
                setSuccess(false);
                setIsLoading(true);
                finishOnboarding.mutate(
                  {},
                  {
                    onSuccess() {
                      toast.success('Successfully finished onboarding');
                      setSuccess(true);
                      router.push('/');
                      setIsLoading(false);
                    },
                    onError() {
                      setSuccess(false);
                      setIsLoading(false);
                      const instance = loadConnectAndInitialize({
                        fetchClientSecret: getClientSecret,
                        publishableKey:
                          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
                      });
                      setStripeConnectInstance(instance);
                    },
                  }
                );
              }}
            />
          </ConnectComponentsProvider>
        </ScrollArea>
      </div>
    );
  }
}
