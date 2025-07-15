'use server';
import { cookies as cookiesNext } from 'next/headers';
import { Cookie } from '../types';

export async function setCookies(cookies: Cookie[]) {
  const cookieStore = await cookiesNext();
  for (const cookie of cookies) {
    if (cookie.value !== '')
      cookieStore.set(cookie.name, cookie.value, cookie.options);
  }
}
