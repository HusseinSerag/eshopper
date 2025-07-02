# @eshopper/client-auth

A robust, production-ready authentication client for React/Next.js apps using TanStack Query. Handles token refresh, request queuing, and integrates with your backend's cookie and header-based auth.

## Features

- Automatic token refresh with exponential backoff
- Request queueing during refresh
- Custom error classes for robust error handling
- Configurable API base URL and logger
- TypeScript-first, fully typed
- Designed for Nx monorepos

## Installation

In your Nx monorepo, this library is already available. Import it directly in your apps:

```ts
import { getAuthClient } from '@eshopper/client-auth';
```

## Usage

### 1. Initialize the Auth Client

```ts
import { QueryClient } from '@tanstack/react-query';
import { getAuthClient } from '@eshopper/client-auth';

const queryClient = new QueryClient();
const baseUrl = '/api'; // or your API base URL
const authClient = getAuthClient(queryClient, baseUrl);
```

### 2. Make Authenticated Requests

```ts
try {
  const data = await authClient.request({
    url: baseUrl + '/protected',
    method: 'GET',
    headers: {},
  });
  // handle data
} catch (error) {
  if (error.name === 'AuthError') {
    // handle auth error (e.g., redirect to login)
  } else {
    // handle other errors
  }
}
```

### 3. Handle Login/Logout

```ts
authClient.loginHandler(accessToken, refreshToken);
// ...
authClient.logoutHandler();
```

## API Reference

### `AuthenticatedHttpClient`

- `constructor(queryClient, baseUrl, logger?)`
- `loginHandler(accessToken, refreshToken)` — Set tokens after login
- `logoutHandler()` — Clear tokens
- `request(config)` — Make an authenticated request
- `clearQueue()` — Clear all queued requests

### Error Classes

- `NetworkError`
- `AuthError`
- `TokenRefreshError`
- `RequestFailedError`

## Best Practices

- Use HTTP-only cookies for refresh tokens when possible
- Always check for and handle `AuthError` in your app
- Use the provided error classes for fine-grained error handling
- Configure the base URL per environment (dev, staging, prod)

## License

MIT (or your license here)
