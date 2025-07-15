'use client';
import { SetCookieComponent } from '../context/setCookieComponent';
import { Cookie } from '../types';
import { useState } from 'react';

export function ClientWrapper({
  cookies,
  children,
}: {
  children: React.ReactNode;
  cookies: Cookie[];
}) {
  const [cookiesSet, setCookiesSet] = useState(false);

  const handleCookiesSet = () => {
    setCookiesSet(true);
  };

  return (
    <>
      <SetCookieComponent cookies={cookies} onComplete={handleCookiesSet} />
      {cookiesSet && children}
    </>
  );
}
