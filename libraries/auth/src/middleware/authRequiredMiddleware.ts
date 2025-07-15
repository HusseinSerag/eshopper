import { NextFunction, Response } from 'express';
import { IRequest } from '@eshopper/global-configuration';

import {
  asyncErrorHandler,
  RefreshTokenExpiredError,
  UserBlocked,
} from '@eshopper/error-handler';
import { TokenProvider } from '../token';
import { AccountType, DatabaseProvider, Session } from '@eshopper/database';
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
  const accountId = decoded.accountId as string;
  const decodedInfoAccessToken = tokenProvider.decodeToken({
    token: accessToken,
  });
  if (!decodedInfoAccessToken) {
    throw new AuthenticationError('Invalid access token please login again');
  }

  if (decodedInfoAccessToken.userId !== userId) {
    throw new AuthenticationError('Token mismatch please login again');
  }
  if (decodedInfoAccessToken.accountId !== accountId) {
    throw new AuthenticationError('Token mismatch please login again');
  }
  if (!(await compareString(accessTokenHashed, accessToken))) {
    throw new AuthenticationError('Token hash mismatch please login again');
  }

  const sessions = await databaseProvider.getPrisma().session.findMany({
    where: {
      userId: userId,
      accountId: accountId,
      isActive: true,
    },
  });

  let validSession: Session | null = null;
  for (const session of sessions) {
    const isMatch = await compareString(session.refreshToken, refreshToken);

    if (isMatch) {
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
    accountId: accountId,
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
    const { userId, validSession, decodedInfoAccessToken, accountId } =
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

    const account = await databaseProvider.getPrisma().account.findUnique({
      where: {
        id: accountId,
        userId: userId,
      },
      include: {
        user: true,
      },
      omit: {
        password: true,
      },
    });
    if (!account) {
      throw new AuthenticationError('User not found please create an account');
    }

    const { user, ...accountWithoutUser } = account;
    req.user = user;
    req.account = accountWithoutUser;
    req.session = validSession;
    next();
  });
}

interface CheckAccountStatusOptions {
  checkEmailVerification?: boolean;
  checkBlocked?: boolean;
}

interface Payload {
  id: string;
}

type NonPasswordProvider = Exclude<AccountType, typeof AccountType.PASSWORD>;
type UserPayload = Payload &
  (
    | {
        isVerified: boolean;
        provider: (typeof AccountType)['PASSWORD'];
      }
    | {
        provider: NonPasswordProvider;
      }
  );
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
  if (
    options.checkEmailVerification &&
    user.provider === 'PASSWORD' &&
    !user.isVerified
  ) {
    throw new AuthenticationError(
      'Account is not verified please verify your email'
    );
  }

  if (options.checkBlocked) {
    const blockedTime = await redis.get(`blocked:${user.id}`);

    if (blockedTime) {
      throw new UserBlocked();
    }
  }
}
export function checkAccountStatusMiddleware(
  redis: Redis,
  databaseProvider: DatabaseProvider,
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
    const emailOwnership = await databaseProvider
      .getPrisma()
      .emailOwnership.findUnique({
        where: {
          userId: req.account!.userId,
          email: req.account!.email,
        },
      });
    const payload = {
      id: req.user!.id,
      provider: req.account!.type,
      isVerified: emailOwnership!.isVerified,
    } as const;
    await checkAccountStatus(redis, payload, options);
    next();
  });
}

export const optionalAuthMiddleware = (
  tokenProvider: TokenProvider,
  databaseProvider: DatabaseProvider,
  redis: Redis
) => {
  return asyncErrorHandler(async function (
    req: IRequest,
    res: Response,
    next: NextFunction
  ) {
    // if everything is exist we populate request
    // if everything doesnt exist we just dont populate request
    try {
      const { accessToken, refreshToken } = extractToken(req);
      const { userId, validSession, decodedInfoAccessToken, accountId } =
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

      const account = await databaseProvider.getPrisma().account.findUnique({
        where: {
          id: accountId,
          userId: userId,
        },
        include: {
          user: true,
        },
        omit: {
          password: true,
        },
      });
      if (!account) {
        throw new AuthenticationError(
          'User not found please create an account'
        );
      }

      const { user, ...accountWithoutUser } = account;
      const emailOwnership = await databaseProvider
        .getPrisma()
        .emailOwnership.findUnique({
          where: {
            email: account.email,
          },
        });
      if (!emailOwnership) {
        throw new AuthenticationError(
          'User not found please create an account'
        );
      }
      const isVerified = emailOwnership.isVerified;
      checkAccountStatus(
        redis,
        {
          id: accountId,
          provider: account.type,
          isVerified: isVerified,
        },
        {
          checkEmailVerification: false,
          checkBlocked: true,
        }
      );
      req.user = user;
      req.account = accountWithoutUser;
      req.session = validSession;
      next();
    } catch {
      next();
    }
  });
};
