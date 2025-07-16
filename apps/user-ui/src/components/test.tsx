'use client';

import { useAuth, useLogout } from '@eshopper/client-auth/client';
import { Button } from '@eshopper/ui';

export function Test() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { mutate } = useLogout();
  if (isLoading) {
    return <div>loading...</div>;
  } else {
    return (
      <>
        <div>{isAuthenticated ? user?.user?.name : 'not authenticated'}</div>
        <Button
          onClick={() => {
            mutate({});
          }}
        >
          logout
        </Button>
      </>
    );
  }
}
