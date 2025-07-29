// ProtectedServerComponent.tsx

import { getAuth } from './client-auth-server';
import { redirect } from 'next/navigation';
import { Cookie, CookieOptions } from '../types';
import { AxiosClient } from '@eshopper/utils/client';
import { ClientWrapper } from './client-wrapper';
import { BaseUser, hasVerifiedEmail } from '@eshopper/shared-types';
import { RedirectionComponent } from './RedirectionComponent';
import { QueryClient } from '@tanstack/react-query';

type Redirection = {
  onInverification: boolean;
  onBlocked: boolean;
};
interface RedirectUrls {
  signIn: string;
  blocked: string;
  verify: string;
}

interface RedirectOn<T extends BaseUser> {
  callback: (user: T) => boolean;
  redirectTo: string;
  priority: number;
}
export interface FactoryConfig<T extends BaseUser> {
  redirectUrls: RedirectUrls;
  defaultRedirection?: Redirection;
  redirectOn?: Array<RedirectOn<T>>;
  meLink: string;
  axiosClient: AxiosClient;
}

export interface ProtectedServerComponentHOCProps<T extends BaseUser> {
  Component: React.ComponentType<{
    user?: T;
    queryClient: QueryClient;
    [key: string]: any;
  }>;
  handleUnauthenticated?: () => void;
  redirection?: Redirection;
  currentUrl?: string;
  [key: string]: any; // to allow arbitrary props
}
function createCookies(accessToken: string, refreshToken: string) {
  // const origin = process.env.NEXT_PUBLIC_ORIGIN_URL!;
  const options: Partial<CookieOptions> = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  const cookies: Cookie[] = [
    {
      name: 'accessToken',
      value: accessToken,
      options,
    },
    {
      name: 'refreshToken',
      value: refreshToken,
      options,
    },
  ];
  return {
    cookies,
    options,
  };
}

export function createProtectedComponent<T extends BaseUser>(
  config: FactoryConfig<T>
) {
  const {
    redirectUrls,
    defaultRedirection = { onBlocked: true, onInverification: true },
    redirectOn = null,
    meLink,
    axiosClient,
  } = config;
  let callbacks: Array<RedirectOn<T>> | null;
  if (redirectOn) {
    callbacks = redirectOn.sort((a, b) => a.priority - b.priority);
  }

  return async function ProtectedServerComponent({
    Component,
    handleUnauthenticated = () => redirect(redirectUrls.signIn),
    redirection = defaultRedirection,
    currentUrl,
    ...rest
  }: ProtectedServerComponentHOCProps<T>) {
    const data = await getAuth(axiosClient, meLink);

    if (data.success === false) {
      handleUnauthenticated();
      return null;
    }
    const queryClient = new QueryClient();
    if (data.success === true && !data.user && data.isBlocked) {
      if (redirection.onBlocked) {
        // go to blocked page
        if (data.refreshed) {
          const { cookies } = createCookies(
            data.accessToken,
            data.refreshToken
          );
          return (
            <ClientWrapper cookies={cookies}>
              <RedirectionComponent link={redirectUrls.blocked} />
            </ClientWrapper>
          );
        }
        redirect(redirectUrls.blocked);
        return null;
      } else {
        if (data.refreshed) {
          const { cookies } = createCookies(
            data.accessToken,
            data.refreshToken
          );
          return (
            <ClientWrapper cookies={cookies}>
              <Component queryClient={queryClient} {...rest} />
            </ClientWrapper>
          );
        }
        return <Component queryClient={queryClient} {...rest} />;
      }
    }

    queryClient.setQueryData(['auth', 'user'], {
      user: data.user,
      success: true,
    });
    if (data.success && data.refreshed === true) {
      const { cookies } = createCookies(data.accessToken, data.refreshToken);
      if (redirection.onInverification && !hasVerifiedEmail(data.user)) {
        return (
          <ClientWrapper cookies={cookies}>
            <RedirectionComponent link={redirectUrls.verify} />
          </ClientWrapper>
        );
      }
      if (callbacks) {
        for (const { callback, redirectTo } of callbacks) {
          if (currentUrl && currentUrl === redirectTo) continue;
          const response = callback(data.user as T); // must return true
          if (response) {
            return (
              <ClientWrapper cookies={cookies}>
                <RedirectionComponent link={redirectTo} />
              </ClientWrapper>
            );
          }
        }
      }

      return (
        <ClientWrapper cookies={cookies}>
          <Component
            freshTokens={{
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            }}
            queryClient={queryClient}
            user={data.user as T}
            {...rest}
          />
          ;
        </ClientWrapper>
      );
    }
    if (redirection.onInverification && !hasVerifiedEmail(data.user)) {
      redirect(redirectUrls.verify);
      return null;
    }
    if (callbacks) {
      for (const { callback, redirectTo } of callbacks) {
        if (currentUrl && currentUrl === redirectTo) continue;
        const response = callback(data.user as T);
        if (response) {
          redirect(redirectTo);
          return null;
        }
      }
    }
    if (data.user)
      return (
        <Component queryClient={queryClient} user={data.user as T} {...rest} />
      );
    return null;
  };
}
