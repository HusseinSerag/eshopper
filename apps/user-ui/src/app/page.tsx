//import { getAuth } from '@eshopper/client-auth/server';
import { Button } from '@eshopper/ui';

import { ProtectedServerComponent } from '@/utils/protectedComponent';

import { Test } from '@/components/test';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function HomePage() {
  return (
    <ProtectedServerComponent
      redirection={{
        onBlocked: true,
        onInverification: true,
      }}
      Component={({ user, queryClient }) => {
        return (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <div className="text-red-500">Hey mate</div>
            <div>
              {JSON.stringify(user, null, 2)}
              <Test />
              <Button variant="destructive">Click me pls </Button>
            </div>
          </HydrationBoundary>
        );
      }}
    />
  );
}
