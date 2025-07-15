# @eshopper/shared-types

Shared TypeScript types used across the eShopper monorepo.

## Usage

```typescript
import type { User, MeResponse } from '@eshopper/shared-types';
```

## Types

- `User` - Complete user type with accounts and email ownership
- `MeResponse` - Response type for `/me` endpoint
- `AccountType` - Enum for account types (PASSWORD, GOOGLE)
- `OAuthError` - OAuth error types and messages
