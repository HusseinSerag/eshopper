import {
  AllowRolesMiddleware,
  authRequiredMiddleware,
  checkAccountStatusMiddleware,
  TokenProvider,
} from '@eshopper/auth';
import { DatabaseProvider } from '@eshopper/database';
import { validationMiddleware } from '@eshopper/middleware';
import { Redis } from '@eshopper/redis';
import { Router } from 'express';
import {
  ResetPasswordRequestSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from '../schemas/auth.schema';
import {
  getBlockedInfoController,
  getVerificationInfo,
  LogAllOutController,
  LogoutController,
  ResendVerificationEmailController,
  ResetPasswordController,
  ResetPasswordRequestController,
  VerifyEmailController,
  VerifyResetPasswordTokenController,
} from '../controllers/auth.controller';
import {
  confirmPhoneNumber,
  getMeSellerController,
  getPhoneVerificationInfo,
  phoneNumberVerificationRequest,
} from '../controllers/seller-auth.controller';
import {
  ConfirmOTPSchema,
  EnterPhoneNumberSchema,
} from '../schemas/seller-auth.schema';

export function createSellerRoutes(
  tokenProvider: TokenProvider,
  dbProvider: DatabaseProvider,
  redisProvider: Redis
) {
  const router = Router();
  router.post(
    '/logout',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider, {
      checkEmailVerification: false,
    }),
    LogoutController
  );

  router.post(
    '/logout-all',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider, {
      checkEmailVerification: false,
    }),
    LogAllOutController
  );

  router.post(
    '/reset-password-request',
    validationMiddleware(ResetPasswordRequestSchema),
    ResetPasswordRequestController
  );

  router.post(
    '/verify-reset-password-token',
    VerifyResetPasswordTokenController
  );
  router.post(
    '/reset-password',
    validationMiddleware(ResetPasswordSchema),
    ResetPasswordController
  );

  router.get(
    '/blocked-info',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider, {
      checkEmailVerification: false,
      checkBlocked: false,
    }),
    getBlockedInfoController
  );

  router.get(
    '/me',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider, {
      checkEmailVerification: false,
      checkBlocked: true,
    }),
    getMeSellerController
  );

  router.get(
    '/verification-info',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider, {
      checkEmailVerification: false,
      checkBlocked: true,
    }),
    getVerificationInfo
  );
  router.post(
    '/verify-email',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider, {
      checkEmailVerification: false,
    }),
    validationMiddleware(VerifyEmailSchema),
    VerifyEmailController
  );
  router.post(
    '/resend-verification-email',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider, {
      checkEmailVerification: false,
    }),
    ResendVerificationEmailController
  );

  router.post(
    '/request-phone-otp',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider),
    validationMiddleware(EnterPhoneNumberSchema),
    phoneNumberVerificationRequest
  );
  router.get(
    '/phone-verification-info',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider),
    getPhoneVerificationInfo
  );
  router.post(
    '/confirm-phone-otp',
    authRequiredMiddleware(tokenProvider, dbProvider),
    AllowRolesMiddleware('seller'),
    checkAccountStatusMiddleware(redisProvider, dbProvider),
    validationMiddleware(ConfirmOTPSchema),
    confirmPhoneNumber
  );

  return router;
}
