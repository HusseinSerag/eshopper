import {
  AppError,
  asyncErrorHandler,
  StatusCode,
} from '@eshopper/error-handler';
import { Request, Response } from 'express';
import {
  LoginUserSchema,
  RegisterUserSchema,
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
} from '../services/auth.service';
import { tokenProvider } from '../main';
import {
  populateResponseWithTokens,
  removeTokensFromResponse,
} from '@eshopper/auth';
import { sendOtpFirstTime } from '../utils/otp';
import { IRequest } from '@eshopper/global-configuration';
export const LoginController = asyncErrorHandler(
  async (
    req: IRequest<unknown, unknown, z.infer<typeof LoginUserSchema>['body']>,
    res: Response
  ) => {
    const user = await loginService(req.body.email, req.body.password);
    const tokens = await tokenProvider.generateTokens({
      data: { userId: user.id },
      options: {},
    });

    await saveTokensToDatabase(
      tokens.accessToken,
      tokens.refreshToken,
      user.id,
      req.headers['user-agent'] || '',
      req.ip || req.socket.remoteAddress || ''
    );

    populateResponseWithTokens(tokens.accessToken, tokens.refreshToken, {
      setCookie: (name, value, options) => {
        res.cookie(name, value, options);
      },
      clearCookie: (name) => {
        res.clearCookie(name);
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
    });
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
    const { email, id: userId } = await SignupService(body);

    sendOtpFirstTime(email);
    const tokens = await tokenProvider.generateTokens({
      data: { userId: userId },
      options: {},
    });

    await saveTokensToDatabase(
      tokens.accessToken,
      tokens.refreshToken,
      userId,
      req.headers['user-agent'] || '',
      req.ip || req.socket.remoteAddress || ''
    );

    populateResponseWithTokens(tokens.accessToken, tokens.refreshToken, {
      setCookie: (name, value, options) => {
        res.cookie(name, value, options);
      },
      clearCookie: (name) => {
        res.clearCookie(name);
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      id: userId,
    });
  }
);

const ResendVerificationEmailController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const user = req.user;
    await resendVerificationEmail(user?.email || '');
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
    const user = req.user;
    if (!user) {
      throw new AppError(
        'User not found',
        StatusCode.NOT_FOUND,
        StatusCode.NOT_FOUND,
        true
      );
    }
    await verifyEmail(user, req.body.otp);
    res.json({
      message: 'Email verified successfully',
    });
  }
);

const LogoutController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    await logout(req.user?.id || '', req.session?.id || '');
    removeTokensFromResponse({
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
    });
    res.json({
      message: 'Logged out successfully',
    });
  }
);

const LogAllOutController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    await logAllOut(req.user?.id || '');
    removeTokensFromResponse({
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
    });
    res.json({
      message: 'Logged out from all devices successfully',
    });
  }
);

const RefreshTokensController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const tokens = await refreshTokens(req);
    populateResponseWithTokens(tokens.accessToken, tokens.refreshToken, {
      setCookie: (name, value, options) => {
        res.cookie(name, value, options);
      },
      clearCookie: (name) => {
        res.clearCookie(name);
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
      },
    });
    res.status(200).json({
      message: 'Tokens refreshed successfully',
    });
  }
);

export {
  SignupController,
  ResendVerificationEmailController,
  VerifyEmailController,
  LogoutController,
  LogAllOutController,
  RefreshTokensController,
};
