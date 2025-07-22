import { asyncErrorHandler } from '@eshopper/error-handler';
import { redisProvider } from '../provider';
import type { Response, Request } from 'express';
import { IRequest } from '@eshopper/global-configuration';
import z from 'zod';
import { CreateSellerSchema } from '../schemas/shop.schema';
import {
  createSellerService,
  getCategoriesService,
  getSellerShop,
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
export {
  getUserShopController,
  getOnboardingInfo,
  createSellerController,
  getShopCategories,
};
