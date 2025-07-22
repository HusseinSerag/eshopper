import { Express } from 'express';
import {
  AllowRolesMiddleware,
  authRequiredMiddleware,
  checkAccountStatusMiddleware,
} from '@eshopper/auth';
import {
  createSellerController,
  getOnboardingInfo,
  getShopCategories,
  getUserShopController,
} from '../controllers/shop.controller';
import { dbProvider, redisProvider, tokenProvider } from '../provider';
import { CreateSellerSchema } from '../schemas/shop.schema';
import { validationMiddleware } from '@eshopper/middleware';
import express from 'express';
export function createRoutes(app: Express) {
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.post(
    '/',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider),
    validationMiddleware(CreateSellerSchema),
    createSellerController
  );
  app.get(
    '/onboarding-info',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider, {
      checkEmailVerification: false,
    }),
    getOnboardingInfo
  );
  app.get('/categories', getShopCategories);
  app.get(
    '/',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider),
    getUserShopController
  );
}
