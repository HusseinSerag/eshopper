import { createAuthenticatedClient } from '@eshopper/client-auth/server';
import { axiosClient } from './axios';

export function createAuthClient() {
  const client = createAuthenticatedClient(axiosClient, '/auth/refresh');
  return {
    ...client,
  };
}
