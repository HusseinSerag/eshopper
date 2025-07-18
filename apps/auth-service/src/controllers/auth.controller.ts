import {
  BadRequestError,
  AppError,
  asyncErrorHandler,
  StatusCode,
  NotFoundError,
  RateLimitError,
  AuthorizationError,
} from '@eshopper/error-handler';
import { Request, Response } from 'express';
import {
  LoginUserSchema,
  RegisterUserSchema,
  ResetPasswordRequestSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from '../schemas/auth.schema';
import { z } from 'zod';
import {
  resendVerificationEmail,
  verifyEmail,
  saveTokensToDatabase,
  SignupService,
  logout,
  logAllOut,
  loginService,
  refreshTokens,
  resetPasswordRequest,
  resetPassword,
  getVerificationInfoService,
  verifyResetPasswordService,
} from '../services/auth.service';
import { dbProvider, redisProvider, tokenProvider } from '../provider';
import {
  populateResponseWithTokens,
  removeTokensFromResponse,
} from '@eshopper/auth';
import { sendOtpFirstTime } from '../utils/otp';
import { IRequest } from '@eshopper/global-configuration';
import { checkAccountStatus } from '@eshopper/auth';
import type {
  BlockedInfoResponse,
  MeShopperResponse,
  OriginSite,
  VerificationInfoResponse,
} from '@eshopper/shared-types';
import { isUserBlocked } from '../utils/block-user';

export const LoginController = asyncErrorHandler(
  async (
    req: IRequest<unknown, unknown, z.infer<typeof LoginUserSchema>['body']>,
    res: Response
  ) => {
    const { account, isVerified, role } = await loginService(
      req.body.email,
      req.body.password
    );

    const accountPayload = {
      id: account.userId,
      provider: 'PASSWORD',
      isVerified: isVerified,
    } as const;

    const origin = req.headers['x-origin-site'] as OriginSite;
    if (role === 'shopper' && origin === 'seller') {
      throw new AuthorizationError('Invalid login credentials');
    }

    await checkAccountStatus(redisProvider, accountPayload, {
      checkEmailVerification: false,
    });
    const tokens = await tokenProvider.generateTokens({
      data: { userId: account.userId, accountId: account.id },
      options: {},
    });

    await saveTokensToDatabase(
      tokens.accessToken,
      tokens.refreshToken,
      account.userId,
      req.headers['user-agent'] || '',
      req.ip || req.socket.remoteAddress || '',
      account.id
    );

    populateResponseWithTokens(
      {
        name: 'accessToken',
        value: tokens.accessToken,
      },
      {
        name: 'refreshToken',
        value: tokens.refreshToken,
      },
      {
        setCookie: (name, value, options) => {
          res.cookie(name, value, options);
        },
        clearCookie: (name) => {
          res.clearCookie(name);
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        },
        domain: origin,
      }
    );

    res.json({
      message: 'Logged in successfully',
    });
  }
);
const SignupController = asyncErrorHandler(
  async (
    req: Request<unknown, unknown, z.infer<typeof RegisterUserSchema>['body']>,
    res: Response
  ) => {
    const body = req.body;
    const { email, userId, accountId } = await SignupService(body);

    sendOtpFirstTime(email);
    const tokens = await tokenProvider.generateTokens({
      data: { userId: userId, accountId: accountId },
      options: {},
    });

    await saveTokensToDatabase(
      tokens.accessToken,
      tokens.refreshToken,
      userId,
      req.headers['user-agent'] || '',
      req.ip || req.socket.remoteAddress || '',
      accountId
    );

    const origin = req.headers['x-origin-site'] as string;
    populateResponseWithTokens(
      {
        name: 'accessToken',
        value: tokens.accessToken,
      },
      {
        name: 'refreshToken',
        value: tokens.refreshToken,
      },
      {
        setCookie: (name, value, options) => {
          res.cookie(name, value, options);
        },
        clearCookie: (name) => {
          res.clearCookie(name);
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        },
        domain: origin,
      }
    );

    res.status(201).json({
      message: 'User registered successfully',
      id: userId,
    });
  }
);

const ResendVerificationEmailController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const account = req.account;
    const emailOwnership = await dbProvider
      .getPrisma()
      .emailOwnership.findUnique({
        where: {
          email: account?.email || '',
        },
      });
    if (emailOwnership?.isVerified || account?.type !== 'PASSWORD') {
      throw new BadRequestError('Email already verified');
    }
    await resendVerificationEmail(account?.email || '');
    res.json({
      message: 'OTP resent successfully',
    });
  }
);

const VerifyEmailController = asyncErrorHandler(
  async (
    req: IRequest<unknown, unknown, z.infer<typeof VerifyEmailSchema>['body']>,
    res: Response
  ) => {
    const account = req.account;
    if (!account) {
      throw new AppError(
        'User not found',
        StatusCode.NOT_FOUND,
        StatusCode.NOT_FOUND,
        true
      );
    }
    const emailOwnership = await dbProvider
      .getPrisma()
      .emailOwnership.findUnique({
        where: {
          email: account.email,
        },
      });
    if (emailOwnership?.isVerified || account.type !== 'PASSWORD') {
      throw new BadRequestError('Email already verified');
    }
    await verifyEmail(account, req.body.otp);
    res.json({
      message: 'Email verified successfully',
    });
  }
);

const LogoutController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    await logout(req.user?.id || '', req.session?.id || '');
    const origin = req.headers['x-origin-site'] as string;

    removeTokensFromResponse(['accessToken', 'refreshToken'], {
      setCookie: (name, value, options) => {
        res.cookie(name, value, options);
      },
      clearCookie: (name) => {
        res.clearCookie(name);
      },
      clearHeader: (name) => {
        res.removeHeader(name);
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
      domain: origin,
    });
    res.json({
      message: 'Logged out successfully',
    });
  }
);

const LogAllOutController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    await logAllOut(req.user?.id || '');
    const origin = req.headers['x-origin-site'] as string;

    removeTokensFromResponse(['accessToken', 'refreshToken'], {
      setCookie: (name, value, options) => {
        res.cookie(name, value, options);
      },
      clearCookie: (name) => {
        res.clearCookie(name);
      },
      clearHeader: (name) => {
        res.removeHeader(name);
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
      domain: origin,
    });
    res.json({
      message: 'Logged out from all devices successfully',
    });
  }
);

const RefreshTokensController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const tokens = await refreshTokens(req);
    const origin = req.headers['x-origin-site'] as string;
    populateResponseWithTokens(
      {
        name: 'accessToken',
        value: tokens.accessToken,
      },
      {
        name: 'refreshToken',
        value: tokens.refreshToken,
      },
      {
        setCookie: (name, value, options) => {
          res.cookie(name, value, options);
        },
        clearCookie: (name) => {
          res.clearCookie(name);
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        },
        domain: origin,
      }
    );

    res.status(200).json({
      message: 'Tokens refreshed successfully',
    });
  }
);

const ResetPasswordRequestController = asyncErrorHandler(
  async (
    req: Request<
      unknown,
      unknown,
      z.infer<typeof ResetPasswordRequestSchema>['body']
    >,
    res: Response
  ) => {
    const origin = req.headers['x-origin-site'] as OriginSite;
    await resetPasswordRequest(req.body.email, origin);
    res.status(200).json({
      message:
        'Reset password instructions will be sent to this email shortly if it exists',
    });
  }
);

export const ResetPasswordController = asyncErrorHandler(
  async (
    req: Request<unknown, unknown, z.infer<typeof ResetPasswordSchema>['body']>,
    res: Response
  ) => {
    const token = Array.isArray(req.query.token)
      ? req.query.token[0]
      : req.query.token;

    if (typeof token !== 'string') {
      throw new AppError(
        'Token is required',
        StatusCode.BAD_REQUEST,
        StatusCode.BAD_REQUEST,
        true
      );
    }
    const origin = req.headers['x-origin-site'] as OriginSite;
    const userId = await resetPassword(req.body.password, token, origin);
    // see if log out all devices is true
    if (req.body.logOutAllDevices) {
      await logAllOut(userId);
    }
    res.json({
      message: 'Password reset successfully',
    });
  }
);

const getMeController = asyncErrorHandler(
  async (req: IRequest<unknown, unknown, unknown>, res: Response) => {
    const id = req.user!.id;

    // we must return account logged in, session and all user info
    const userInformation = await dbProvider.getPrisma().users.findUnique({
      where: {
        id: id,
      },
      include: {
        account: {
          select: {
            id: true,
            type: true,
            isPrimary: true,
            email: true,
            createdAt: true,
          },
        },
        avatar: {
          select: {
            id: true,
            file_id: true,
            url: true,
          },
        },
        emailOwnership: {
          select: {
            email: true,
            isVerified: true,
          },
        },
      },
    });

    const response: MeShopperResponse = {
      user: {
        ...userInformation!,
        role: 'shopper',
        createdAt: userInformation!.createdAt.toISOString(),
        updatedAt: userInformation!.updatedAt.toISOString(),
        avatar: userInformation!.avatar
          ? {
              ...userInformation!.avatar,
              file_id: userInformation!.avatar.file_id || undefined,
            }
          : undefined,
        account: userInformation!.account.map((acc) => ({
          ...acc,
          type: acc.type as any, // Cast to avoid enum mismatch
          createdAt: acc.createdAt.toISOString(),
        })),
      },
    };

    return res.status(200).json(response);
  }
);

export const getVerificationInfo = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const user = req.user!;
    const account = req.account!;
    const isVerified = await dbProvider.getPrisma().emailOwnership.findUnique({
      where: {
        userId: user.id,
        email: account.email,
      },
    });
    if (!isVerified) {
      throw new NotFoundError('Account not found');
    }
    if (isVerified.isVerified) {
      throw new BadRequestError('Account already verified');
    }
    const data = (await getVerificationInfoService(
      account.email
    )) as VerificationInfoResponse;
    return res.status(200).json({
      data: data,
    });
  }
);

const getBlockedInfoController = asyncErrorHandler(async function (
  req: IRequest,
  res
) {
  const isBlocked = await isUserBlocked(req.user!.id);
  const data = {
    isBlocked,
  } as BlockedInfoResponse;
  return res.status(200).json({
    data: data,
  });
});

const VerifyResetPasswordTokenController = asyncErrorHandler(async function (
  req: Request,
  res: Response
) {
  const token = Array.isArray(req.query.token)
    ? req.query.token[0]
    : req.query.token;

  if (typeof token !== 'string') {
    throw new AppError(
      'Token is required',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }
  const origin = req.headers['x-origin-site'] as OriginSite;
  const { rateLimited, valid, email, retryAfter } =
    await verifyResetPasswordService(token, origin);

  if (!valid) {
    if (rateLimited) {
      // Create a custom rate limit error that includes retryAfter
      const error = new RateLimitError(
        'Too many failed attempts. Please try again later. ' + retryAfter
      );

      throw error;
    }

    throw new AppError(
      'Invalid or expired token',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }

  return res.status(200).json({
    success: true,
    message: 'Token is valid',
    email: email,
  });
});
export {
  SignupController,
  ResendVerificationEmailController,
  VerifyEmailController,
  LogoutController,
  LogAllOutController,
  RefreshTokensController,
  ResetPasswordRequestController,
  getMeController,
  getBlockedInfoController,
  VerifyResetPasswordTokenController,
};
