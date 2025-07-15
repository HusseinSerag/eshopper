import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest) {
  console.log('called ' + request.headers.get('cookie'));
  const originalCookies = request.headers.get('cookie') || '';

  try {
    const meRes = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: { cookie: originalCookies },
      credentials: 'include',
    });

    if (meRes.ok) {
      const user = await meRes.json();
      const r = NextResponse.json(user);
      const setCookieHeader = meRes.headers.get('set-cookie') || '';
      // Split multiple Set-Cookie headers safely
      const cookies = setCookieHeader.split(/,(?=\s*\w+=)/);

      // Extract only the cookie name=value parts for forwarding

      for (const c of cookies) {
        r.headers.append('set-cookie', c);
      }
      return r;
    }

    if (meRes.status === 401) {
      const errorData = await meRes.clone().json();

      const shouldRefresh = errorData?.resCode === 4011;

      if (shouldRefresh) {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { cookie: originalCookies },
          credentials: 'include',
        });

        const setCookieHeader = refreshRes.headers.get('set-cookie'); // string or null
        console.log('new cookies: ', setCookieHeader);
        if (refreshRes.ok && setCookieHeader) {
          // Split multiple Set-Cookie headers safely
          const cookies = setCookieHeader.split(/,(?=\s*\w+=)/);

          // Extract only the cookie name=value parts for forwarding
          const cookiePairs = cookies
            .map((cookieStr) => cookieStr.split(';')[0])
            .join('; ');

          const meRes2 = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
              cookie: cookiePairs, // Correct cookie header format
            },
            credentials: 'include',
          });

          if (meRes2.ok) {
            const user = await meRes2.json();
            const response = NextResponse.json(user);

            // Set all Set-Cookie headers from refresh response on Next.js response
            for (const c of cookies) {
              response.headers.append('set-cookie', c);
            }

            return response;
          }
        }

        const refreshError = await refreshRes.json();
        return NextResponse.json(refreshError, {
          status: refreshRes.status,
        });
      }

      return NextResponse.json(errorData, { status: 401 });
    }

    const fallbackError = await meRes.json();
    return NextResponse.json(fallbackError, { status: meRes.status });
  } catch (err) {
    console.error('SSR Auth error:', err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
