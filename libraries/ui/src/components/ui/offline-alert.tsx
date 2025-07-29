'use client';

import { useOffline } from '@eshopper/client-auth/client';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { XIcon } from 'lucide-react';

export function OfflineAlert() {
  const { isOpen, setIsOpen } = useOffline();
  // return null;

  if (!isOpen) return null;
  return (
    <div className="absolute bottom-2 p-2 left-2 bg-white max-w-sm">
      <Alert variant="destructive" className="pr-8">
        <AlertTitle>You are offline</AlertTitle>
        <AlertDescription>
          Please connect to the internet to be able to use our service.
        </AlertDescription>
      </Alert>
      <XIcon
        onClick={() => setIsOpen(false)}
        className="absolute text-red-500 right-4 top-4 size-4 cursor-pointer"
      />
    </div>
  );
}
