import { z } from 'zod';
import { RegisterUserSchema } from '../schemas/auth.schema';
import { config, dbProvider, redisProvider, tokenProvider } from '../main';
import {
  AppError,
  AuthenticationError,
  StatusCode,
} from '@eshopper/error-handler';
import { compareString, getDeviceInfo, hashString } from '@eshopper/utils';
import { handleUserOtp } from '../utils/otp';
import { Users } from '@eshopper/database';
import { extractToken, validateTokens } from '@eshopper/auth';
import { IRequest } from '@eshopper/global-configuration';

export async function SignupService(
  data: z.infer<typeof RegisterUserSchema>['body']
) {
  const { email, password } = data;
  const user = await dbProvider.getPrisma().users.findUnique({
    where: {
      email,
    },
  });
  if (user) {
    throw new AppError(
      'User already exists',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }
  const hashedPassword = await hashString(password);
  // create user
  const newUser = await dbProvider.getPrisma().users.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  return newUser;
}

export async function saveTokensToDatabase(
  accessToken: string,
  refreshToken: string,
  userId: string,
  userAgent: string,
  ipAddress: string,
  sessionId?: string
) {
  const prisma = dbProvider.getPrisma();
  const hashedRefreshToken = await hashString(refreshToken);
  const decoded = tokenProvider.decodeToken({ token: refreshToken });
  if (!decoded || !decoded.exp) {
    throw new Error('Invalid refresh token - missing expiration');
  }

  // Convert JWT exp (seconds since epoch) to Date
  const expiresAt = new Date(decoded.exp * 1000);
  if (sessionId) {
    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        refreshToken: hashedRefreshToken,
        expiresAt,
      },
    });
  } else {
    await prisma.session.create({
      data: {
        refreshToken: hashedRefreshToken,
        userAgent,
        ipAddress,
        userId,
        deviceInfo: getDeviceInfo(userAgent),
        expiresAt,
      },
    });
  }
}

async function checkOtpRestrictions(email: string) {
  const cooldown = await redisProvider.get(`otp_cooldown:${email}`);
  if (!cooldown) {
    // check if the user has sent otp too many times
    const cooldownCount = await redisProvider.get(
      `otp_cooldown_count:${email}`
    );
    let coolDownCount = 0;
    if (cooldownCount) {
      if (parseInt(cooldownCount) >= config.get('MAX_OTP_COUNT')) {
        throw new AppError(
          'Too many otp requests',
          StatusCode.TOO_MANY_REQUESTS,
          StatusCode.TOO_MANY_REQUESTS,
          true
        );
      }
      await redisProvider.incr(`otp_cooldown_count:${email}`);
      coolDownCount = parseInt(cooldownCount) + 1;
    } else {
      await redisProvider.setTTL(
        `otp_cooldown_count:${email}`,
        '1',
        config.get('MAX_OTP_COOLDOWN_TIME')
      );
      coolDownCount = 1;
    }

    const step = config.get('OTP_COOLDOWN_STEP');
    await redisProvider.setTTL(
      `otp_cooldown:${email}`,
      `1`,
      config.get('OTP_COOLDOWN_BASE_TIME') + coolDownCount * step
    );

    return true;
  }
  // user hass to wait for the cooldown to end
  return false;
}

export async function resendVerificationEmail(email: string) {
  const isRestricted = await checkOtpRestrictions(email);
  if (!isRestricted) {
    throw new AppError(
      'Please wait before requesting another OTP',
      StatusCode.TOO_MANY_REQUESTS,
      StatusCode.TOO_MANY_REQUESTS,
      true
    );
  }
  // send email if allowed
  await handleUserOtp(email);
}

export async function verifyEmail(user: Users, otp: string) {
  if (user.isVerified) {
    throw new AppError(
      'Email already verified',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }
  const savedOTP = await redisProvider.get(`otp:${user.email}`);
  if (!savedOTP) {
    throw new AppError(
      'Please request a new OTP',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }
  if (savedOTP !== otp) {
    // count the number of times the user has entered invalid otp
    const invalidOTPCount = await redisProvider.get(
      `invalid_otp_count:${user.email}`
    );
    if (!invalidOTPCount) {
      await redisProvider.setTTL(
        `invalid_otp_count:${user.email}`,
        '1',
        config.get('MAX_INVALID_OTP_WINDOW')
      );
    } else {
      await redisProvider.incr(`invalid_otp_count:${user.email}`);
      if (
        parseInt(invalidOTPCount) + 1 >=
        config.get('MAX_INVALID_OTP_COUNT')
      ) {
        await redisProvider.setTTL(
          `blocked:${user.id}`,
          (Date.now() + config.get('BLOCKED_TIME') * 1000).toString(),
          config.get('BLOCKED_TIME')
        );
        throw new AppError(
          'Too many invalid OTPs, account blocked for 24 hours',
          StatusCode.BAD_REQUEST,
          StatusCode.BAD_REQUEST,
          true
        );
      }
    }

    throw new AppError(
      'Invalid OTP',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }
  try {
    await dbProvider.getPrisma().users.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // Only cleanup Redis after successful DB update
    await Promise.all([
      redisProvider.delete(`otp:${user.email}`),
      redisProvider.delete(`invalid_otp_count:${user.email}`),
      redisProvider.delete(`otp_cooldown:${user.email}`),
      redisProvider.delete(`otp_cooldown_count:${user.email}`),
    ]);
  } catch {
    throw new AppError(
      'Verification failed, please try again',
      StatusCode.INTERNAL_SERVER_ERROR,
      StatusCode.INTERNAL_SERVER_ERROR,
      true
    );
  }
}

export async function logout(userId: string, sessionId: string) {
  const prisma = dbProvider.getPrisma();
  await prisma.session.delete({
    where: {
      userId,
      id: sessionId,
    },
  });
}

export async function logAllOut(userId: string) {
  const prisma = dbProvider.getPrisma();
  await prisma.session.deleteMany({
    where: {
      userId,
    },
  });
}

export async function loginService(email: string, password: string) {
  const user = await dbProvider.getPrisma().users.findUnique({
    where: {
      email,
    },
  });
  if (!user || !user.password) {
    throw new AuthenticationError('Invalid email/ password');
  }
  const isPasswordValid = await compareString(user.password, password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email/ password');
  }
  return user;
}

export async function refreshTokens(req: IRequest) {
  const { accessToken, refreshToken } = extractToken(req);
  const { userId, validSession } = await validateTokens(
    tokenProvider,
    dbProvider,
    accessToken,
    refreshToken
  );
  const user = await dbProvider.getPrisma().users.findUnique({
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
  const tokens = await tokenProvider.generateTokens({
    data: { userId: userId },
    options: {},
  });

  await saveTokensToDatabase(
    tokens.accessToken,
    tokens.refreshToken,
    userId,
    req.headers['user-agent'] || '',
    req.ip || req.socket.remoteAddress || '',
    validSession.id
  );

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}
