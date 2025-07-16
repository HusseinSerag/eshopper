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
import { Account } from '@eshopper/database';
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
import { OriginSite } from '@eshopper/shared-types';

export async function SignupService(
  data: z.infer<typeof RegisterUserSchema>['body']
) {
  const { email, password, name, role } = data;
  const ownership = await dbProvider.getPrisma().emailOwnership.findUnique({
    where: {
      email,
    },
  });
  if (ownership) {
    throw new AppError(
      'User already exists',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }

  const user = await dbProvider.getPrisma().users.create({
    data: {
      name,
      role,
      emailOwnership: {
        create: [{ email, isVerified: false }],
      },
      account: {
        create: [
          {
            email,
            type: 'PASSWORD',
            password: await hashString(password),
            isPrimary: true,
          },
        ],
      },
    },
    include: {
      account: true,
    },
  });

  return { email, userId: user.id, accountId: user.account[0].id };
}

export async function saveTokensToDatabase(
  accessToken: string,
  refreshToken: string,
  userId: string,
  userAgent: string,
  ipAddress: string,
  accountId: string,
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
        accountId,
      },
    });
  }
}

export async function getVerificationInfoService(email: string) {
  const cooldown = await redisProvider.getTTLTimeLeft(`otp_cooldown:${email}`);
  console.log(cooldown);
  const numberOfRequestsPerWindow = await redisProvider.get(
    `otp_cooldown_count:${email}`
  );
  const invalidOtpCount = await redisProvider.get(`invalid_otp_count:${email}`);
  const maxInvalidOTP = config.get('MAX_INVALID_OTP_COUNT');
  const maxResendRequests = config.get('MAX_OTP_COUNT');
  const newRequestWindow = await redisProvider.getTTLTimeLeft(
    `otp_cooldown_count:${email}`
  );
  return {
    cooldown: cooldown,
    numberOfRequestsPerWindow: numberOfRequestsPerWindow
      ? parseInt(numberOfRequestsPerWindow, 10)
      : 0,
    invalidOtpCount: invalidOtpCount ? parseInt(invalidOtpCount, 10) : 0,
    maxInvalidOTP,
    maxResendRequests,
    newRequestWindow,
  };
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
      (config.get('OTP_COOLDOWN_BASE_TIME') + coolDownCount * step).toString(),
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

export async function verifyEmail(account: Account, otp: string) {
  const emailOwnership = await dbProvider
    .getPrisma()
    .emailOwnership.findUnique({
      where: {
        email: account.email,
      },
    });
  if (emailOwnership?.isVerified) {
    throw new AppError(
      'Email already verified',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }
  const savedOTP = await redisProvider.get(`otp:${account.email}`);
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
      `invalid_otp_count:${account.email}`
    );
    if (!invalidOTPCount) {
      await redisProvider.setTTL(
        `invalid_otp_count:${account.email}`,
        '1',
        config.get('MAX_INVALID_OTP_WINDOW')
      );
    } else {
      await redisProvider.incr(`invalid_otp_count:${account.email}`);
      if (
        parseInt(invalidOTPCount) + 1 >=
        config.get('MAX_INVALID_OTP_COUNT')
      ) {
        await blockUser(account.userId);
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
    await dbProvider.getPrisma().emailOwnership.update({
      where: { email: account.email },
      data: { isVerified: true },
    });
    await kafkaProvider.sendMessage({
      topic: 'notifications',
      key: account.email,
      value: JSON.stringify({
        type: 'EMAIL',
        channel: 'WELCOME_EMAIL',
        email: account.email,
        userName: account.email,
      }),
    });

    // Only cleanup Redis after successful DB update
    await Promise.all([
      redisProvider.delete(`otp:${account.email}`),
      redisProvider.delete(`invalid_otp_count:${account.email}`),
      redisProvider.delete(`otp_cooldown:${account.email}`),
      redisProvider.delete(`otp_cooldown_count:${account.email}`),
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
  const account = await dbProvider.getPrisma().account.findFirst({
    where: {
      email,
      type: 'PASSWORD',
    },
  });
  if (!account || !account.password) {
    throw new AuthenticationError('Invalid email/ password');
  }
  const isPasswordValid = await compareString(account.password, password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email/ password');
  }

  const emailOwnership = await dbProvider
    .getPrisma()
    .emailOwnership.findUnique({
      where: {
        email,
      },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

  if (!emailOwnership) {
    throw new AuthenticationError('No user exist for this email!');
  }
  return {
    account,
    isVerified: emailOwnership.isVerified,
    role: emailOwnership.user.role,
  };
}

export async function refreshTokens(req: IRequest) {
  const { accessToken, refreshToken } = extractToken(req);
  const { userId, accountId, validSession } = await validateTokens(
    tokenProvider,
    dbProvider,
    accessToken,
    refreshToken
  );
  const account = await dbProvider.getPrisma().account.findFirst({
    where: {
      id: accountId,
      userId: userId,
    },
    omit: {
      password: true,
    },
  });
  if (!account) {
    throw new AuthenticationError('User not found please create an account');
  }
  const emailOwnership = await dbProvider
    .getPrisma()
    .emailOwnership.findUnique({
      where: {
        email: account.email,
      },
    });

  await checkAccountStatus(
    redisProvider,
    {
      id: account.userId,
      isVerified: emailOwnership?.isVerified ?? false,
      provider: account.type,
    },
    {
      checkEmailVerification: false,
      checkBlocked: false,
    }
  );
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
    accountId,
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

// Helper function to increment false token count and handle rate limiting
async function incrementFalseTokenCount(token: string): Promise<boolean> {
  const falseTokenCount = await redisProvider.get(`false_token_count:${token}`);

  if (!falseTokenCount) {
    await redisProvider.setTTL(
      `false_token_count:${token}`,
      '1',
      config.get('MAX_FALSE_TOKEN_COUNT_WINDOW')
    );
    return false; // Not rate limited yet
  } else {
    const newCount = await redisProvider.incr(`false_token_count:${token}`);

    if (newCount >= config.get('MAX_FALSE_TOKEN_COUNT')) {
      // Handle user blocking logic
      const result = await verifyResetPasswordToken(token);
      if (result.email) {
        const account = await dbProvider.getPrisma().account.findFirst({
          where: {
            email: result.email,
            type: 'PASSWORD',
          },
        });
        const emailOwnership = await dbProvider
          .getPrisma()
          .emailOwnership.findUnique({
            where: {
              email: result.email,
            },
          });

        // Only block if account exists and is verified
        if (account && account.password && emailOwnership?.isVerified) {
          await blockUser(account.userId);
        }
      }
      return true; // Rate limited
    }
    return false; // Not rate limited yet
  }
}

// Helper function to check if token is currently rate limited
async function isTokenRateLimited(
  token: string
): Promise<{ rateLimited: boolean; retryAfter?: number }> {
  const falseTokenCount = await redisProvider.get(`false_token_count:${token}`);
  const currentCount = parseInt(falseTokenCount || '0');

  if (currentCount >= config.get('MAX_FALSE_TOKEN_COUNT')) {
    const ttl = await redisProvider.getTTLTimeLeft(
      `false_token_count:${token}`
    );
    return {
      rateLimited: true,
      retryAfter: ttl > 0 ? ttl : undefined,
    };
  }

  return { rateLimited: false };
}

// Helper function to validate account and email ownership
async function validateAccountAndEmail(email: string): Promise<boolean> {
  const account = await dbProvider.getPrisma().account.findFirst({
    where: {
      email: email,
      type: 'PASSWORD',
    },
  });

  const emailOwnership = await dbProvider
    .getPrisma()
    .emailOwnership.findUnique({
      where: {
        email: email,
      },
    });

  return !!(account && account.password && emailOwnership?.isVerified);
}

export async function verifyResetPasswordService(
  token: string,
  origin: OriginSite
) {
  // First check if token is currently rate limited
  const rateLimitCheck = await isTokenRateLimited(token);
  if (rateLimitCheck.rateLimited) {
    return {
      valid: false,
      rateLimited: true,
      retryAfter: rateLimitCheck.retryAfter,
    };
  }

  // Verify the token itself
  const result = await verifyResetPasswordToken(token);

  if (result.result === false) {
    return {
      valid: false,
      rateLimited: false,
      email: result.email,
    };
  }
  const userRole = await dbProvider.getPrisma().emailOwnership.findUnique({
    where: {
      email: result.email,
    },
    include: {
      user: {
        select: {
          role: true,
        },
      },
    },
  });
  if (!userRole) throw new BadRequestError('This user does not exist!');

  if (origin !== userRole.user.role) {
    throw new BadRequestError('Please access the correct url');
  }
  // Verify the account exists and is valid
  if (!result.email || !(await validateAccountAndEmail(result.email))) {
    return {
      valid: false,
      rateLimited: false,
      email: result.email,
    };
  }

  return {
    valid: true,
    rateLimited: false,
    email: result.email,
    randomId: result.randomId,
  };
}

export async function resetPassword(
  password: string,
  token: string,
  origin: OriginSite
) {
  // First verify the token
  const verification = await verifyResetPasswordService(token, origin);

  if (!verification.valid) {
    if (verification.rateLimited) {
      throw new AppError(
        'Too many failed attempts. Please try again later.',
        StatusCode.TOO_MANY_REQUESTS,
        StatusCode.TOO_MANY_REQUESTS,
        true
      );
    }

    // Increment false token count for invalid tokens
    const isRateLimited = await incrementFalseTokenCount(token);

    if (isRateLimited) {
      throw new AppError(
        'Unable to reset password. Please contact support.',
        StatusCode.TOO_MANY_REQUESTS,
        StatusCode.TOO_MANY_REQUESTS,
        true
      );
    }

    throw new AppError(
      'Invalid token',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }

  // Get the account (we know it exists from verification)
  const account = await dbProvider.getPrisma().account.findFirst({
    where: {
      email: verification.email!,
      type: 'PASSWORD',
    },
  });

  // Additional safety check (shouldn't happen if verification works correctly)
  if (!account || !account.password) {
    throw new AppError(
      'Unable to reset password. Please contact support.',
      StatusCode.BAD_REQUEST,
      StatusCode.BAD_REQUEST,
      true
    );
  }

  // Check if new password is the same as old password
  const isSamePassword = await compareString(account.password, password);
  if (isSamePassword) {
    throw new BadRequestError('Password is the same as the old one');
  }

  // Update the password
  await dbProvider.getPrisma().account.update({
    where: {
      id: account.id,
    },
    data: {
      password: await hashString(password),
    },
  });

  // Send notification email
  await kafkaProvider.sendMessage({
    topic: 'notifications',
    key: account.email,
    value: JSON.stringify({
      type: 'EMAIL',
      channel: 'PASSWORD_CHANGED',
      email: account.email,
      userName: account.email,
    }),
  });

  // Set password change timestamp
  const expiresAt =
    Date.now() + config.get('MAX_PASSWORD_CHANGE_WINDOW') * 1000;
  await redisProvider.setTTL(
    `last_password_change:${account.email}`,
    expiresAt.toString(),
    config.get('MAX_PASSWORD_CHANGE_WINDOW')
  );

  // Clean up Redis keys
  await Promise.all([
    redisProvider.delete(`false_token_count:${token}`),
    redisProvider.delete(`reset_password_cooldown:${account.email}`),
    redisProvider.delete(`reset_password_count:${account.email}`),
    redisProvider.delete(`reset_password_token:${verification.randomId}`),
    redisProvider.delete(`email_reset_password_token:${account.email}`),
  ]);

  return account.userId;
}

export async function resetPasswordRequest(email: string, origin: OriginSite) {
  const account = await dbProvider.getPrisma().account.findFirst({
    where: {
      email,
      type: 'PASSWORD',
    },
    include: {
      user: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!account) {
    return;
  }
  if (account.user.role !== origin) {
    return;
  }

  const emailOwnership = await dbProvider
    .getPrisma()
    .emailOwnership.findUnique({
      where: {
        email,
      },
    });
  const isBlocked = (await isUserBlocked(account.userId)) > 0;
  if (isBlocked || !emailOwnership?.isVerified) {
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
    key: account.email,
    value: JSON.stringify({
      type: 'EMAIL',
      channel: 'PASSWORD_RESET',
      email: account.email,
      userName: account.email,
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
