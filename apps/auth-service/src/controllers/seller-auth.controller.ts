import { asyncErrorHandler } from '@eshopper/error-handler';
import type { IRequest } from '@eshopper/global-configuration';
import { redisProvider } from '../provider';
import type { Response } from 'express';

const getOnboardingInfo = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const information = await redisProvider.get(`onboarding:${req.user!.id}`);

    return res.status(200).json({
      onboardingStep: information ? parseInt(information, 10) : 0,
    });
  }
);
export { getOnboardingInfo };
