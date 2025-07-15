import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
const API_URL = process.env.NEXT_PUBLIC_API_URL!;
export async function GET(request: NextRequest) {
  const res = await fetch(`${API_URL}/auth/test-cookie`, {
    method: 'GET',

    credentials: 'include',
  });
  const setCookieHeader = res.headers.get('set-cookie');

  const response = new NextResponse(await res.text(), {
    status: res.status,
  });

  // Forward the Set-Cookie header to the browser
  if (setCookieHeader) {
    response.headers.set('Set-Cookie', setCookieHeader);
  }

  return response;
}
