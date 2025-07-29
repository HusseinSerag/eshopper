import express from 'express';
import { dbProvider, redisProvider, tokenProvider } from '../provider';

import {
  AllowRolesMiddleware,
  authRequiredMiddleware,
  checkAccountStatusMiddleware,
  IncludeSellerMiddleware,
} from '@eshopper/auth';

import {
  checkIfUserHasOnboarded,
  createSellerController,
  CreateStripeAccountController,
  getOnboardingInfo,
  getShopCategories,
  getUserShopController,
} from '../controllers/shop.controller';
import { CreateSellerSchema } from '../schemas/shop.schema';

import { validationMiddleware } from '@eshopper/middleware';

export function createRoutes(app: express.Express) {
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
  app.post(
    '/create-stripe-link',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider),
    IncludeSellerMiddleware(dbProvider),
    CreateStripeAccountController
  );
  app.post(
    '/finish-onboarding',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider),
    IncludeSellerMiddleware(dbProvider),
    checkIfUserHasOnboarded
  );
}
