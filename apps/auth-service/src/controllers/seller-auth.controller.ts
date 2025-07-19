import { asyncErrorHandler } from '@eshopper/error-handler';
import type { IRequest } from '@eshopper/global-configuration';
import { dbProvider, redisProvider } from '../provider';
import type { Response } from 'express';
import { MeSellerResponse } from '@eshopper/shared-types';

const getOnboardingInfo = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const information = await redisProvider.get(`onboarding:${req.user!.id}`);

    return res.status(200).json({
      onboardingStep: information ? parseInt(information, 10) : 0,
    });
  }
);
const getMeSellerController = asyncErrorHandler(
  async (req: IRequest<unknown, unknown, unknown>, res: Response) => {
    const id = req.user!.id;

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
            }
          : undefined,
      },
    };
    return res.status(200).json(meResponse);
  }
);
export { getOnboardingInfo, getMeSellerController };
