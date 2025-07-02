import { User } from '../types';

/**
 * Checks if a user is authenticated in a server context.
 * @param queryClient TanStack QueryClient instance
 * @param baseUrl API base URL (e.g. "/api")
 * @param headers Headers to forward (cookies, authorization, etc.)
 * @returns The user object if authenticated, or null if not.
 */
export const getAuth = async (
  baseUrl: string,
  headers: Record<string, string>
) => {
  // 1. Try /auth/me
  let res;
  try {
    res = await fetch(baseUrl + '/auth/me', {
      method: 'GET',
      headers,
      credentials: 'include',
    });
  } catch (e) {
    return null;
  }

  if (res.ok) return (await res.json()) as User;

  // 2. If 401, try to refresh
  if (!res.ok) {
    const errorRes = (await res.json().catch(() => ({}))) as any;
    if (errorRes.status === 401 && errorRes.resCode === 4011) {
      const refreshRes = await fetch(baseUrl + '/auth/refresh', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!refreshRes.ok) return null; // Refresh failed

      // 3. Retry /auth/me after refresh
      res = await fetch(baseUrl + '/auth/me', {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      if (res.ok) return (await res.json()) as User;
    }
  }
  return null;
};
