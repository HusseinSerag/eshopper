//import { getAuth } from '@eshopper/client-auth/server';
import { Button } from '@eshopper/ui';

import { ProtectedServerComponent } from '@eshopper/client-auth/server';
import { axiosClient } from '@/utils/axios';
import { Test } from '@/components/test';

export default async function HomePage() {
  return (
    <ProtectedServerComponent
      redirection={{
        onBlocked: true,
        onInverification: false,
      }}
      axiosClient={axiosClient}
      Component={({ user }) => {
        return (
          <>
            <div className="text-red-500">Hey mate</div>
            <div>
              {JSON.stringify(user, null, 2)}
              <Test />
              <Button variant="destructive">Click me pls </Button>
            </div>
          </>
        );
      }}
    />
  );
}
