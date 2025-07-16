import { ResponseAdapter } from '@eshopper/global-configuration';
import { CookieOptions } from 'express';

type CookieKV = {
  name: string;
  value: string;
};

export function populateResponseWithTokens(
  accessToken: CookieKV,
  refreshToken: CookieKV,
  res: ResponseAdapter<CookieOptions>
) {
  // hash tokens first and then set cookies

  res.setCookie(accessToken.name.replace(/\./g, '_'), accessToken.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.setCookie(refreshToken.name.replace(/\./g, '_'), refreshToken.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.setHeader('Authorization', `Bearer ${accessToken}`);
  res.setHeader('fallback_access_token', accessToken.value);
  res.setHeader('fallback_refresh_token', refreshToken.value);
  return { accessToken, refreshToken };
}

export function removeTokensFromResponse(
  cookies: string[],
  res: ResponseAdapter<CookieOptions>
) {
  for (const cookie of cookies) {
    res.clearCookie(cookie);
  }
  res.clearHeader?.('fallback_access_token');
  res.clearHeader?.('fallback_refresh_token');
  res.clearHeader?.('Authorization');
}
