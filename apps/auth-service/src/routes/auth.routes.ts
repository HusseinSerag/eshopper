import { tokenProvider, dbProvider, redisProvider } from '../provider';
import express, { Express, Response } from 'express';
import {
  ResendVerificationEmailController,
  SignupController,
  VerifyEmailController,
  LogoutController,
  LogAllOutController,
  LoginController,
  RefreshTokensController,
  ResetPasswordRequestController,
  ResetPasswordController,
} from '../controllers/auth.controller';
import { validationMiddleware } from '@eshopper/middleware';
import {
  LoginUserSchema,
  RegisterUserSchema,
  ResetPasswordRequestSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from '../schemas/auth.schema';
import {
  authRequiredMiddleware,
  checkAccountStatusMiddleware,
} from '@eshopper/auth';
import { IRequest } from '@eshopper/global-configuration';
import swaggerSpec from './swagger';
import swaggerUi from 'swagger-ui-express';
import { config } from '../provider';
import { logger } from '@eshopper/logger';

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
    checkAccountStatusMiddleware(redisProvider, {
      checkEmailVerification: false,
    }),
    LogoutController
  );

  app.post(
    '/logout-all',
    authRequiredMiddleware(tokenProvider, dbProvider),
    checkAccountStatusMiddleware(redisProvider, {
      checkEmailVerification: false,
    }),
    LogAllOutController
  );

  app.post('/refresh', RefreshTokensController);

  app.post(
    '/reset-password-request',
    validationMiddleware(ResetPasswordRequestSchema),
    ResetPasswordRequestController
  );

  app.post(
    '/reset-password',
    validationMiddleware(ResetPasswordSchema),
    ResetPasswordController
  );

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

  if (config.get('NODE_ENV') === 'development') {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/docs-json', (req, res) => {
      res.json(swaggerSpec);
    });
    logger.info('Swagger UI is enabled');
    logger.info(`Swagger UI is at ${config.get('GATEWAY_ORIGIN')}/auth/docs`);
    logger.info(
      `Swagger JSON is at ${config.get('GATEWAY_ORIGIN')}/auth/docs-json`
    );
  }
}
