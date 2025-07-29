'use client';
import { useEffect, useState } from 'react';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false);
      setIsOpen(false);
    };

    const goOffline = () => {
      setIsOffline(true);
      setIsOpen(true);
    };

    // @ts-expect-error this works in client
    window.addEventListener('online', goOnline);
    // @ts-expect-error this works in client
    window.addEventListener('offline', goOffline);

    // Clean up
    return () => {
      // @ts-expect-error this works in client
      window.removeEventListener('online', goOnline);
      // @ts-expect-error this works in client
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return {
    isOffline,
    isOpen,
    setIsOpen: (value: boolean) => setIsOpen(value),
  };
}
