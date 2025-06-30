import { z } from 'zod';
import { RegisterUserSchema } from '../schemas/auth.schema';
import { dbProvider } from '../main';
import { AppError, StatusCode } from '@eshopper/error-handler';
import { getDeviceInfo, hashString } from '@eshopper/utils';

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
  ipAddress: string
) {
  const prisma = dbProvider.getPrisma();
  const hashedRefreshToken = await hashString(refreshToken);
  await prisma.session.create({
    data: {
      refreshToken: hashedRefreshToken,
      userAgent,
      ipAddress,
      userId,
      deviceInfo: getDeviceInfo(userAgent),
    },
  });
}
