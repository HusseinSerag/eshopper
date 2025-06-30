import { ResponseAdapter } from '@eshopper/global-configuration';
import { CookieOptions } from 'express';

export function populateResponseWithTokens(
  accessToken: string,
  refreshToken: string,
  res: ResponseAdapter<CookieOptions>
) {
  // hash tokens first and then set cookies
  res.setCookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000, // 15 minutes
    sameSite: 'strict',
  });
  res.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict',
  });
  res.setHeader('Authorization', `Bearer ${accessToken}`);
  res.setHeader('fallback_access_token', accessToken);
  res.setHeader('fallback_refresh_token', refreshToken);
  return { accessToken, refreshToken };
}

export function removeTokensFromResponse(res: ResponseAdapter<CookieOptions>) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearHeader?.('fallback_access_token');
  res.clearHeader?.('fallback_refresh_token');
  res.clearHeader?.('Authorization');
}
