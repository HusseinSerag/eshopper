import { NextFunction, Response } from 'express';
import { IRequest } from '@eshopper/global-configuration';

import {
  asyncErrorHandler,
  RefreshTokenExpiredError,
} from '@eshopper/error-handler';
import { TokenProvider } from '../token';
import { DatabaseProvider, Session } from '@eshopper/database';
import { Redis } from '@eshopper/redis';
import { AuthenticationError } from '@eshopper/error-handler';
import { compareString } from '@eshopper/utils';

export function extractToken(req: IRequest) {
  // we have authorization(access token) fallback_access_token fallback_refresh_token in headers
  // in cookies we have accessToken and refreshToken

  const accessToken = (req.headers.authorization?.split(' ')?.[1] ||
    req.headers.fallback_access_token ||
    req.cookies.accessToken) as string;
  const refreshToken = (req.cookies.refreshToken ||
    req.headers.fallback_refresh_token) as string;
  if (!accessToken || !refreshToken) {
    throw new AuthenticationError('Missing tokens please login again');
  }
  return { accessToken, refreshToken };
}

export async function validateTokens(
  tokenProvider: TokenProvider,
  databaseProvider: DatabaseProvider,
  accessToken: string,
  refreshToken: string
) {
  const result = tokenProvider.verifyToken({
    token: refreshToken,
    type: 'refresh',
  });
  if (!result) {
    throw new AuthenticationError('Invalid refresh token please login again');
  }
  const resAccessToken = tokenProvider.verifyToken({
    token: accessToken,
    type: 'access',
    options: {
      ignoreExpiration: true,
    },
  });
  if (!resAccessToken) {
    throw new AuthenticationError('Invalid access token please login again');
  }
  // check if refresh token is valid and get userId
  const decoded = tokenProvider.decodeToken({
    token: refreshToken,
  });
  if (!decoded) {
    throw new AuthenticationError('Invalid refresh token please login again');
  }
  const userId = decoded.userId as string;
  const accessTokenHashed = decoded.accessToken as string;

  const decodedInfoAccessToken = tokenProvider.decodeToken({
    token: accessToken,
  });
  if (!decodedInfoAccessToken) {
    throw new AuthenticationError('Invalid access token please login again');
  }
  console.log(decodedInfoAccessToken, decoded);
  if (decodedInfoAccessToken.userId !== userId) {
    throw new AuthenticationError('Token mismatch please login again');
  }
  if (!(await compareString(accessTokenHashed, accessToken))) {
    throw new AuthenticationError('Token hash mismatch please login again');
  }

  const sessions = await databaseProvider.getPrisma().session.findMany({
    where: {
      userId: userId,
      isActive: true,
    },
  });

  let validSession: Session | null = null;
  for (const session of sessions) {
    if (await compareString(session.refreshToken, refreshToken)) {
      validSession = session;
      break;
    }
  }
  if (!validSession) {
    throw new AuthenticationError('No session found,please login again');
  }
  return {
    userId: userId,
    validSession: validSession,
    decodedInfoAccessToken: decodedInfoAccessToken,
  };
}
export function authRequiredMiddleware(
  tokenProvider: TokenProvider,
  databaseProvider: DatabaseProvider
) {
  return asyncErrorHandler(async function (
    req: IRequest,
    res: Response,
    next: NextFunction
  ) {
    const { accessToken, refreshToken } = extractToken(req);
    const { userId, validSession, decodedInfoAccessToken } =
      await validateTokens(
        tokenProvider,
        databaseProvider,
        accessToken,
        refreshToken
      );
    // check expiry of access token
    const accessTokenExpiry = decodedInfoAccessToken.exp as number;
    const currentTime = Date.now() / 1000;
    if (accessTokenExpiry < currentTime) {
      // generate new access token
      throw new RefreshTokenExpiredError('REFRESH ACCESS TOKEN');
    }

    const user = await databaseProvider.getPrisma().users.findUnique({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
    });
    if (!user) {
      throw new AuthenticationError('User not found please create an account');
    }

    req.user = user;
    req.session = validSession;
    next();
  });
}

interface CheckAccountStatusOptions {
  checkEmailVerification?: boolean;
  checkBlocked?: boolean;
}

interface UserPayload {
  id: string;
  isVerified: boolean;
}
export async function checkAccountStatus(
  redis: Redis,
  user: UserPayload,
  userOptions?: CheckAccountStatusOptions
) {
  const options = {
    checkEmailVerification: true,
    checkBlocked: true,
    ...userOptions,
  };
  if (options.checkEmailVerification && !user.isVerified) {
    throw new AuthenticationError(
      'Account is not verified please verify your email'
    );
  }

  if (options.checkBlocked) {
    const blockedTime = await redis.get(`blocked:${user.id}`);

    if (blockedTime) {
      const timeLeft = parseInt(blockedTime) - Date.now();
      throw new AuthenticationError(
        `Account is blocked for ${timeLeft} seconds please contact support`
      );
    }
  }
}
export function checkAccountStatusMiddleware(
  redis: Redis,
  userOptions?: CheckAccountStatusOptions
) {
  const options = {
    checkEmailVerification: true,
    checkBlocked: true,
    ...userOptions,
  };

  return asyncErrorHandler(async function (
    req: IRequest,
    res: Response,
    next: NextFunction
  ) {
    await checkAccountStatus(redis, req.user!, options);
    next();
  });
}
