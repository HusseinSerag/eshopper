import { Express, Response } from 'express';
import {
  ResendVerificationEmailController,
  SignupController,
  VerifyEmailController,
  LogoutController,
  LogAllOutController,
  LoginController,
  RefreshTokensController,
} from '../controllers/auth.controller';
import { validationMiddleware } from '@eshopper/middleware';
import {
  LoginUserSchema,
  RegisterUserSchema,
  VerifyEmailSchema,
} from '../schemas/auth.schema';
import express from 'express';
import {
  authRequiredMiddleware,
  checkAccountStatusMiddleware,
} from '@eshopper/auth';
import { tokenProvider, dbProvider, redisProvider } from '../main';
import { IRequest } from '@eshopper/global-configuration';

export function createRoutes(app: Express) {
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.post(
    '/register',
    validationMiddleware(RegisterUserSchema),
    SignupController
  );
  app.post('/login', validationMiddleware(LoginUserSchema), LoginController);
  app.post(
    '/logout',
    authRequiredMiddleware(tokenProvider, dbProvider),
    LogoutController
  );
  app.post(
    '/logout-all',
    authRequiredMiddleware(tokenProvider, dbProvider),
    LogAllOutController
  );
  app.post('/refresh', RefreshTokensController);
  app.post('/reset-password');
  app.post(
    '/verify-email',
    authRequiredMiddleware(tokenProvider, dbProvider),
    checkAccountStatusMiddleware(redisProvider, {
      checkEmailVerification: false,
    }),
    validationMiddleware(VerifyEmailSchema),
    VerifyEmailController
  );
  app.post(
    '/resend-verification-email',
    authRequiredMiddleware(tokenProvider, dbProvider),
    checkAccountStatusMiddleware(redisProvider, {
      checkEmailVerification: false,
    }),
    ResendVerificationEmailController
  );

  // inject otp information
  app.get(
    '/me',
    authRequiredMiddleware(tokenProvider, dbProvider),
    checkAccountStatusMiddleware(redisProvider, {
      checkEmailVerification: false,
      checkBlocked: false,
    }),
    async (req: IRequest, res: Response) => {
      const otpCooldown = await redisProvider.get(
        `otp_cooldown:${req.user?.email}`
      );
      res.json({
        user: {
          ...req.user,
          otpCooldown,
        },
      });
    }
  );
}
