import { config } from '../main';
import {
  MeSellerResponse,
  PhoneNumberVerificationInfo,
} from '@eshopper/shared-types';
import { dbProvider, redisProvider } from '../provider';
import {
  BadRequestError,
  RateLimitError,
  UserBlocked,
} from '@eshopper/error-handler';
import { handlePhoneNumberOTP } from '../utils/otp';
import { blockUser } from '../utils/block-user';

export async function getSellerMeService(id: string) {
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
      seller: {
        select: {
          id: true,
          stripeId: true,
          phone_number: true,
          isPhoneVerified: true,
        },
      },
    },
  });
  const meResponse: MeSellerResponse = {
    user: {
      ...userInformation!,
      role: userInformation!.role,
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
      seller: userInformation!.seller
        ? {
            id: userInformation!.seller.id,
            stripeId: userInformation!.seller.stripeId
              ? userInformation!.seller.stripeId
              : undefined,
            isPhoneVerified: userInformation!.seller.isPhoneVerified,
            phone_number: userInformation!.seller.phone_number
              ? userInformation!.seller.phone_number
              : undefined,
          }
        : undefined,
    },
  };
  return meResponse;
}

export async function validatePhoneNumberOtp(
  userId: string,
  phoneNumber: string,
  suppliedOtp: string
) {
  const otp = await redisProvider.get(`phone_number_otp:${phoneNumber}`);
  if (!otp) {
    throw new BadRequestError('Otp is invalid or expired');
  }
  if (otp !== suppliedOtp) {
    const tries = await redisProvider.get(`invalid_phone_otp:${userId}`);
    let numberTries: number;
    if (!tries) {
      numberTries = 1;
      await redisProvider.setTTL(
        `invalid_phone_otp:${userId}`,
        '1',
        config.get('MAX_INVALID_PHONE_NUMBER_WINDOW')
      );
    } else {
      numberTries = Number(tries) + 1;
      await redisProvider.incr(`invalid_phone_otp:${userId}`);
    }

    if (numberTries === config.get('MAX_INVALID_PHONE_NUMBER_OTP')) {
      await blockUser(userId);
      throw new UserBlocked();
    }
    throw new BadRequestError('Invalid OTP');
  }
  await dbProvider.getPrisma().users.update({
    where: {
      id: userId,
    },
    data: {
      seller: {
        update: {
          phone_number: phoneNumber,
          isPhoneVerified: true,
        },
      },
    },
  });
  await Promise.all([
    redisProvider.delete(`phone_number_otp:${phoneNumber}`),
    redisProvider.delete(`invalid_phone_otp:${userId}`),
    redisProvider.delete(`phone_cooldown:${phoneNumber}`),
    redisProvider.delete(`user_phone_cooldown:${userId}`),
    redisProvider.delete(`phone_request_tries:${userId}`),
    await redisProvider.set(`onboarding:${userId}`, '4'),
  ]);
}

export async function requestPhoneNumberConfirmation(
  userId: string,
  phoneNumber: string,
  username: string
) {
  const seller = await dbProvider.getPrisma().sellers.findUnique({
    where: {
      phone_number: phoneNumber,
    },
  });
  if (seller) {
    throw new BadRequestError('Cannot send OTP to this phone number');
  }

  const phone_cooldown = await redisProvider.getTTLTimeLeft(
    `phone_cooldown:${phoneNumber}`
  );
  const user_cooldown = await redisProvider.getTTLTimeLeft(
    `user_phone_cooldown:${userId}`
  );
  if (phone_cooldown > 0) {
    throw new BadRequestError('Please wait until the phone cooldown is over');
  }
  if (user_cooldown > 0) {
    throw new BadRequestError('Please wait until you can request again');
  }

  if (user_cooldown < 0 && phone_cooldown < 0) {
    const tries = await redisProvider.get(`phone_request_tries:${userId}`);

    // maximum amount of tries
    if (tries)
      if (Number(tries) >= config.get('MAX_REQUEST_PHONE_NUMBER')) {
        throw new RateLimitError(
          'maximum amount of tries inside the current window, please try again later'
        );
      }
    let numberOfTries: number;
    if (!tries) {
      // 24 hours
      await redisProvider.setTTL(
        `phone_request_tries:${userId}`,
        '1',
        config.get('MAX_REQUEST_WINDOW')
      );
      numberOfTries = 1;
    } else {
      await redisProvider.incr(`phone_request_tries:${userId}`);
      numberOfTries = Number(tries) + 1;
    }

    // send OTP

    await handlePhoneNumberOTP(phoneNumber, username);

    const ttl =
      config.get('PHONE_NUMBER_BASE_TIME') +
      numberOfTries * config.get('PHONE_NUMBER_STEP');
    await redisProvider.setTTL(
      `phone_cooldown:${phoneNumber}`,
      phoneNumber,
      ttl
    );
    await redisProvider.setTTL(
      `user_phone_cooldown:${userId}`,
      phoneNumber,
      ttl
    );
  }
}

export async function getPhoneNumberVerificationInfoService(
  userId: string
): Promise<PhoneNumberVerificationInfo> {
  const activeNumber = await redisProvider.get(`user_phone_cooldown:${userId}`);
  const userCooldown = await redisProvider.getTTLTimeLeft(
    `user_phone_cooldown:${userId}`
  );
  const numberCooldown = await redisProvider.getTTLTimeLeft(
    `phone_cooldown:${activeNumber}`
  );
  const tries = await redisProvider.get(`invalid_phone_otp:${userId}`);
  const maxTries = config.get('MAX_INVALID_PHONE_NUMBER_OTP');
  const maxRequest = config.get('MAX_REQUEST_PHONE_NUMBER');
  const windowForRequests = await redisProvider.getTTLTimeLeft(
    `phone_request_tries:${userId}`
  );
  const windowForInvalidOtps = config.get('MAX_INVALID_PHONE_NUMBER_WINDOW');
  const numberOfRequestsPerWindow = await redisProvider.get(
    `phone_request_tries:${userId}`
  );
  return {
    maxTries,
    numberCooldown,
    tries: tries ? Number(tries) : 0,
    userCooldown,
    number: activeNumber || '',
    maxRequest,
    windowForInvalidOtps,
    windowForRequests,
    numberOfRequestsPerWindow: numberOfRequestsPerWindow
      ? Number(numberOfRequestsPerWindow)
      : 0,
  };
}
