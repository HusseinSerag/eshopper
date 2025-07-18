'use client';

import { createContext, useContext } from 'react';
import { AuthenticateHttpClient } from '../lib/client-auth';

interface AuthContextValue {
  httpClient: AuthenticateHttpClient;
  authRoute: string;
}
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      'useAuthContext must be used within an AuthContextProvider'
    );
  }
  return context;
};
