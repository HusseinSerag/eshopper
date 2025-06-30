import { asyncErrorHandler } from '@eshopper/error-handler';
import { Request, Response } from 'express';
import { RegisterUserSchema } from '../schemas/auth.schema';
import { z } from 'zod';
import { saveTokensToDatabase, SignupService } from '../services/auth.service';
import { tokenProvider } from '../main';
import { populateResponseWithTokens } from '@eshopper/auth';
import { handleUserOtp } from '../utils/otp';

const SignupController = asyncErrorHandler(
  async (
    req: Request<unknown, unknown, z.infer<typeof RegisterUserSchema>['body']>,
    res: Response
  ) => {
    const body = req.body;
    const { email, id: userId } = await SignupService(body);

    handleUserOtp(email);
    const tokens = tokenProvider.generateTokens({
      data: { id: userId },
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

export { SignupController };
