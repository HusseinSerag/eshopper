'use client';
import { useEffect } from 'react';
import { Cookie } from '../types';
import { setCookies } from '../server/setCookie.action';

interface Props {
  cookies: Cookie[];
  onComplete?: () => void;
}
export function SetCookieComponent({ cookies, onComplete }: Props) {
  useEffect(
    function () {
      (async () => {
        await setCookies(cookies);
        if (onComplete) {
          onComplete();
        }
      })();
    },
    [cookies, onComplete]
  );
  return null;
}
