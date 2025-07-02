import { z } from 'zod';
import { RegisterUserSchema } from '../schemas/auth.schema';
import {
  config,
  kafkaProvider,
  dbProvider,
  redisProvider,
  tokenProvider,
} from '../provider';
import {
  AppError,
  AuthenticationError,
  StatusCode,
  BadRequestError,
} from '@eshopper/error-handler';
import { compareString, getDeviceInfo, hashString } from '@eshopper/utils';
import { handleUserOtp } from '../utils/otp';
import { Users } from '@eshopper/database';
import {
  checkAccountStatus,
  extractToken,
  validateTokens,
} from '@eshopper/auth';
import { IRequest } from '@eshopper/global-configuration';
import { blockUser, isUserBlocked } from '../utils/block-user';
import {
  generateAndStoreResetPasswordToken,
  verifyResetPasswordToken,
} from '../utils/reset-password';

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
  const isAllowed = await checkOtpRestrictions(email);
  if (!isAllowed) {
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
        await blockUser(user.id);
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
    await kafkaProvider.sendMessage({
      topic: 'notifications',
      key: user.email,
      value: JSON.stringify({
        type: 'EMAIL',
        channel: 'WELCOME_EMAIL',
        email: user.email,
        userName: user.email,
      }),
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
  await checkAccountStatus(
    redisProvider,
    {
      id: userId,
      isVerified: user.isVerified,
    },
    {
      checkEmailVerification: false,
    }
  );
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

// Helper to format seconds as human-readable duration
function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0)
    return `${days} day${days > 1 ? 's' : ''}${
      hours ? ` ${hours} hour${hours > 1 ? 's' : ''}` : ''
    }`;
  if (hours > 0)
    return `${hours} hour${hours > 1 ? 's' : ''}${
      minutes ? ` ${minutes} minute${minutes > 1 ? 's' : ''}` : ''
    }`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} seconds`;
}

export async function resetPassword(password: string, token: string) {
  const result = await verifyResetPasswordToken(token);
  if (result.result === false) {
    // deal with rate limiting wrong tokens
    const falseTokenCount = await redisProvider.get(
      `false_token_count:${token}`
    );
    if (!falseTokenCount) {
      await redisProvider.setTTL(
        `false_token_count:${token}`,
        '1',
        config.get('MAX_FALSE_TOKEN_COUNT_WINDOW')
      );
    } else {
      await redisProvider.incr(`false_token_count:${token}`);
      if (
        parseInt(falseTokenCount) + 1 >=
        config.get('MAX_FALSE_TOKEN_COUNT')
      ) {
        // block the user
        if (result.email) {
          const user = await dbProvider.getPrisma().users.findUnique({
            where: {
              email: result.email,
            },
          });
          // Throw generic error for blocked/unverified
          if (!user || !user.password || !user.isVerified) {
            throw new AppError(
              'Unable to reset password. Please contact support.',
              StatusCode.BAD_REQUEST,
              StatusCode.BAD_REQUEST,
              true
            );
          }
          await blockUser(user.id);
          throw new AppError(
            'Unable to reset password. Please contact support.',
            StatusCode.BAD_REQUEST,
            StatusCode.BAD_REQUEST,
            true
          );
        }
      }
    }
    throw new AppError(
      'Invalid token',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }

  const user = await dbProvider.getPrisma().users.findUnique({
    where: {
      email: result.email,
    },
  });
  // Throw generic error for blocked/unverified
  if (!user || !user.password || !user.isVerified) {
    throw new AppError(
      'Unable to reset password. Please contact support.',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }

  const hashedPassword = await compareString(user.password, password);
  if (hashedPassword) {
    throw new BadRequestError('Password is the same as the old one');
  }
  await dbProvider.getPrisma().users.update({
    where: {
      id: user.id,
    },
    data: {
      password: await hashString(password),
    },
  });

  await kafkaProvider.sendMessage({
    // send email to the user
    topic: 'notifications',
    key: user.email,
    value: JSON.stringify({
      type: 'EMAIL',
      channel: 'PASSWORD_CHANGED',
      email: user.email,
      userName: user.email,
    }),
  });
  const expiresAt =
    Date.now() + config.get('MAX_PASSWORD_CHANGE_WINDOW') * 1000;
  await redisProvider.setTTL(
    `last_password_change:${user.email}`,
    expiresAt.toString(),
    config.get('MAX_PASSWORD_CHANGE_WINDOW')
  );
  Promise.all([
    redisProvider.delete(`false_token_count:${token}`),
    redisProvider.delete(`reset_password_cooldown:${user.email}`),
    redisProvider.delete(`reset_password_count:${user.email}`),
    redisProvider.delete(`reset_password_token:${result.randomId}`),
  ]);

  return user.id;
}

export async function resetPasswordRequest(email: string) {
  const user = await dbProvider.getPrisma().users.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    return;
  }
  const isBlocked = await isUserBlocked(user.id);
  if (isBlocked || !user.isVerified || !user.password) {
    return;
  }
  const isAllowed = await checkResetPasswordRestrictions(email);
  if (!isAllowed) {
    throw new AppError(
      'Please wait before requesting another reset password request',
      StatusCode.TOO_MANY_REQUESTS,
      StatusCode.TOO_MANY_REQUESTS,
      true
    );
  }

  // generate reset token
  const token = await generateAndStoreResetPasswordToken(email);

  // send email to the user
  await kafkaProvider.sendMessage({
    topic: 'notifications',
    key: user.email,
    value: JSON.stringify({
      type: 'EMAIL',
      channel: 'PASSWORD_RESET',
      email: user.email,
      userName: user.email,
      resetUrl: `${config.get('CLIENT_ORIGIN')}/reset-password?token=${token}`,
    }),
  });
}

export async function checkResetPasswordRestrictions(email: string) {
  const changedRecently = await redisProvider.get(
    `last_password_change:${email}`
  );
  if (changedRecently) {
    const secondsLeft = Math.max(
      0,
      Math.floor((parseInt(changedRecently) - Date.now()) / 1000)
    );
    throw new BadRequestError(
      'You have changed your password recently, please wait for ' +
        formatDuration(secondsLeft)
    );
  }

  const cooldown = await redisProvider.get(`reset_password_cooldown:${email}`);
  if (!cooldown) {
    // check if the user has sent reset password request too many times
    const resetPasswordCount = await redisProvider.get(
      `reset_password_count:${email}`
    );
    let count = 0;
    if (resetPasswordCount) {
      if (
        parseInt(resetPasswordCount) >= config.get('MAX_RESET_PASSWORD_COUNT')
      ) {
        throw new AppError(
          'Too many reset password requests',
          StatusCode.TOO_MANY_REQUESTS,
          StatusCode.TOO_MANY_REQUESTS,
          true
        );
      }
      await redisProvider.incr(`reset_password_count:${email}`);
      count = parseInt(resetPasswordCount) + 1;
    } else {
      await redisProvider.setTTL(
        `reset_password_count:${email}`,
        '1',
        config.get('MAX_RESET_PASSWORD_COOLDOWN_TIME')
      );
      count = 1;
    }

    const step = config.get('RESET_PASSWORD_COOLDOWN_STEP');
    await redisProvider.setTTL(
      `reset_password_cooldown:${email}`,
      `1`,
      config.get('RESET_PASSWORD_COOLDOWN_BASE_TIME') + count * step
    );

    return true;
  }
  // user has to wait for the cooldown to end
  return false;
}
