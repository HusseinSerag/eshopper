// ProtectedServerComponent.tsx

import { getAuth } from './client-auth-server';
import { redirect } from 'next/navigation';
import { Cookie, CookieOptions, User } from '../types';
import { AxiosClient } from '@eshopper/utils/client';
import { ClientWrapper } from './client-wrapper';
import { hasVerifiedEmail } from '@eshopper/shared-types';
import { RedirectionComponent } from './RedirectionComponent';

type Redirection = {
  onInverification: boolean;
  onBlocked: boolean;
};

interface Props {
  Component: React.ComponentType<{ user?: User; [key: string]: any }>;
  handleUnauthenticated?: () => void;
  axiosClient: AxiosClient;
  redirection?: Redirection;
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
export async function ProtectedServerComponent({
  Component,
  axiosClient,
  handleUnauthenticated = () => redirect('/auth/sign-in'),
  redirection = {
    onBlocked: true,
    onInverification: true,
  },
  ...rest
}: Props) {
  const data = await getAuth(axiosClient);

  if (data.success === false) {
    handleUnauthenticated();
    return null;
  }
  if (data.success === true && !data.user && data.isBlocked) {
    if (redirection.onBlocked) {
      // go to blocked page
      if (data.refreshed) {
        const { cookies } = createCookies(data.accessToken, data.refreshToken);
        return (
          <ClientWrapper cookies={cookies}>
            <RedirectionComponent link="/blocked" />
          </ClientWrapper>
        );
      }
      redirect('/blocked');
      return null;
    } else {
      if (data.refreshed) {
        const { cookies } = createCookies(data.accessToken, data.refreshToken);
        return (
          <ClientWrapper cookies={cookies}>
            <Component {...rest} />
          </ClientWrapper>
        );
      }
      return <Component {...rest} />;
    }
  }
  if (data.success && data.refreshed === true) {
    const { cookies } = createCookies(data.accessToken, data.refreshToken);
    if (redirection.onInverification && !hasVerifiedEmail(data.user)) {
      return (
        <ClientWrapper cookies={cookies}>
          <RedirectionComponent link="/auth/verify" />
        </ClientWrapper>
      );
    }
    return (
      <ClientWrapper cookies={cookies}>
        <Component
          freshTokens={{
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }}
          user={data.user}
          {...rest}
        />
        ;
      </ClientWrapper>
    );
  }
  if (redirection.onInverification && !hasVerifiedEmail(data.user)) {
    redirect('/auth/verify');
    return null;
  }
  if (data.user) return <Component user={data.user} {...rest} />;
  return null;
}
