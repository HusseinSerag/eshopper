'use client';

import { AuthContext } from './useAuthContext';

interface AuthContextProviderProps {
  children: React.ReactNode;
  baseUrl: string;
}

export const AuthContextProvider = ({
  children,
  baseUrl,
}: AuthContextProviderProps) => {
  return (
    <AuthContext.Provider value={{ baseUrl }}>{children}</AuthContext.Provider>
  );
};
