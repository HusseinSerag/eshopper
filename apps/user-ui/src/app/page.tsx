import { LoginForm } from '@/components/login-form';
import { getAuth } from '@eshopper/client-auth/server';
import { headers } from 'next/headers';

export default async function Index() {
  await getAuth(
    process.env.NEXT_PUBLIC_API_URL || '',
    Object.fromEntries(await headers())
  );

  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.tailwind file.
   */
  return <LoginForm />;
}
