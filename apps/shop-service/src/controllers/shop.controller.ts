import { asyncErrorHandler, BadRequestError } from '@eshopper/error-handler';
import { redisProvider, dbProvider } from '../provider';
import type { Response, Request } from 'express';
import { IRequest } from '@eshopper/global-configuration';
import z from 'zod';
import { CreateSellerSchema } from '../schemas/shop.schema';
import {
  createSellerService,
  createStripeAccountService,
  // createStripeAccountService,
  getCategoriesService,
  getSellerShop,
  retrieveStripeInfo,
} from '../services/shop.service';

import { SellerWithShop } from '@eshopper/shared-types';

const getOnboardingInfo = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const information = await redisProvider.get(`onboarding:${req.user!.id}`);

    return res.status(200).json({
      onboardingStep: information ? parseInt(information, 10) : 0,
    });
  }
);

const createSellerController = asyncErrorHandler(
  async (
    req: IRequest<unknown, unknown, z.infer<typeof CreateSellerSchema>['body']>,
    res: Response
  ) => {
    const body = req.body;
    console.log(body);
    const { seller, shop } = await createSellerService(body, req.user!.id);

    return res.status(200).json({
      shopId: shop.id,
      sellerId: seller.id,
    });
  }
);

const getShopCategories = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const data = getCategoriesService();
    return res.status(200).json({
      data: data,
    });
  }
);

const getUserShopController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const sellerInformation = (await getSellerShop(
      req.user?.id!
    )) as SellerWithShop;
    return res.status(200).json({
      data: sellerInformation ? sellerInformation : null,
    });
  }
);

const CreateStripeAccountController = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    const email = req.account!.email;
    const { data } = await createStripeAccountService(email, req.seller!);
    const client_secret = data.client_secret;

    return res.status(200).json({
      client_secret,
    });
  }
);

const checkIfUserHasOnboarded = asyncErrorHandler(
  async (req: IRequest, res: Response) => {
    if (!req.seller?.stripeId) {
      throw new BadRequestError('No stripe account please create one first');
    }
    const account = await retrieveStripeInfo(req.seller!.stripeId);
    if (account.details_submitted && account.charges_enabled) {
      await redisProvider.delete(`onboarding:${req.user!.id}`);
      await dbProvider.getPrisma().sellers.update({
        where: {
          id: req.seller!.id,
        },
        data: {
          isOnboarded: true,
        },
      });
      return res.status(200).json({
        message: 'success',
      });
    }
    throw new BadRequestError(
      'Please continue with the onboarding process first'
    );
  }
);
export {
  getUserShopController,
  getOnboardingInfo,
  createSellerController,
  getShopCategories,
  CreateStripeAccountController,
  checkIfUserHasOnboarded,
};
