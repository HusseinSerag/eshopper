'use client';
import { useAuthenticatedQuery } from '@eshopper/client-auth/client';
import { BlockedInfoResponse } from '@eshopper/shared-types';
import { useCountdown } from '@eshopper/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function BlockedView() {
  const { data } = useAuthenticatedQuery<{ data: BlockedInfoResponse }>(
    ['blocked-info'],
    '/auth/blocked-info'
  );
  const router = useRouter();

  useEffect(() => {
    if (data?.data)
      if (data?.data?.isBlocked < 0) {
        router.push('/');
      }
  }, [data, router]);
  if (!data?.data) return null;
  if (data?.data.isBlocked < 0) {
    return null;
  }
  return <BlockedCard timeLeft={data.data.isBlocked} />;
}

function BlockedCard({ timeLeft }: { timeLeft: number }) {
  const { hours, minutes, seconds } = useCountdown(timeLeft);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold mb-2">
          Your account is temporarily blocked
        </h2>
        <p className="text-gray-500 dark:text-gray-300 mb-6">
          For your security, your account has been blocked for a period of time.
          Please wait until the timer below reaches zero to regain access.
        </p>
        <div className="text-3xl font-semibold tracking-widest mb-6 text-red-500">
          {hours.toString().padStart(2, '0')}:
          {minutes.toString().padStart(2, '0')}:
          {seconds.toString().padStart(2, '0')}
        </div>
        <a
          href="mailto:husseinserag2014@gmail.com"
          className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
