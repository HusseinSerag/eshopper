import type { IRequest } from '@eshopper/global-configuration';
import type { Response, NextFunction } from 'express';
import { asyncErrorHandler, BadRequestError } from '@eshopper/error-handler';
import { DatabaseProvider } from '@eshopper/database';

export const IncludeSellerMiddleware = (dbProvider: DatabaseProvider) =>
  asyncErrorHandler(
    async (req: IRequest, res: Response, next: NextFunction) => {
      const userId = req.user!.id;
      const seller = await dbProvider.getPrisma().sellers.findUnique({
        where: {
          userId: userId,
        },
        include: {
          shop: true,
        },
      });
      if (!seller) {
        throw new BadRequestError('Please create a shop first!');
      }
      if (!seller.shop) {
        throw new BadRequestError('Please create a shop first');
      }
      req.seller = seller;
      next();
    }
  );
