'use client';

import { AuthContextProvider } from '@eshopper/client-auth';

export function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthContextProvider baseUrl={process.env.NEXT_PUBLIC_API_URL || ''}>
      {children}
    </AuthContextProvider>
  );
}
