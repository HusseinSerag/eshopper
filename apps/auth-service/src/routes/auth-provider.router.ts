import { Router } from 'express';
import {
  GoogleOAuthController,
  GoogleOAuthCallbackController,
} from '../controllers/auth-provider.controller';
import { optionalAuthMiddleware } from '@eshopper/auth';
import { TokenProvider } from '@eshopper/auth';
import { DatabaseProvider } from '@eshopper/database';
import { Redis } from '@eshopper/redis';

export function createAuthProviderRoutes(
  tokenProvider: TokenProvider,
  databaseProvider: DatabaseProvider,
  redis: Redis
) {
  const router = Router();
  router.get(
    '/google',
    optionalAuthMiddleware(tokenProvider, databaseProvider, redis),
    GoogleOAuthController(redis)
  );

  router.get('/google/callback', GoogleOAuthCallbackController);

  return router;
}
