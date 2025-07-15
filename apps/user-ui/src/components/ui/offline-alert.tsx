'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@eshopper/ui';
import { XIcon } from 'lucide-react';

export function OfflineAlert() {
  const [_, setIsOffline] = useState(false);
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

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Clean up
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  if (!isOpen) return null;
  // return null;
  return (
    <div className="sticky bottom-4 left-4 bg-white max-w-sm">
      <Alert variant="destructive" className="pr-8">
        <AlertTitle>You are offline</AlertTitle>
        <AlertDescription>
          Please connect to the internet to be able to use our service.
        </AlertDescription>
      </Alert>
      <XIcon
        onClick={() => setIsOpen(false)}
        className="absolute text-red-500 right-2 top-2 size-4 cursor-pointer"
      />
    </div>
  );
}
