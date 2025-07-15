'use client';

import { AuthenticateHttpClient } from '../lib/client-auth';
import { AuthContext } from './useAuthContext';

interface AuthContextProviderProps {
  children: React.ReactNode;
  client: AuthenticateHttpClient;
}

export const AuthContextProvider = ({
  children,
  client,
}: AuthContextProviderProps) => {
  return (
    <AuthContext.Provider
      value={{
        httpClient: client,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
