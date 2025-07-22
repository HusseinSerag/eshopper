import z from 'zod';

import { dbProvider, redisProvider } from '../provider';
import { CreateSellerSchema } from '../schemas/shop.schema';
import { categoryMap } from '../data';
import { BadRequestError } from '@eshopper/error-handler';

export async function createSellerService(
  body: z.infer<typeof CreateSellerSchema>['body'],
  userId: string
) {
  const category = categoryMap.get(body.shop.categoryId);
  if (category && category.value === 'other' && !body.shop.otherCategory) {
    throw new BadRequestError('Please specify the other category');
  }
  if (category && category.value !== 'other') {
    body.shop.otherCategory = '';
  }
  return await dbProvider.getPrisma().$transaction(async (tx) => {
    const seller = await tx.sellers.upsert({
      where: { userId },
      create: {
        country: body.country,
        userId,
      },
      update: {
        country: body.country,
      },
    });

    const shop = await tx.shops.upsert({
      where: { sellerId: seller.id },
      create: {
        ...body.shop,
        sellerId: seller.id,
      },
      update: {
        ...body.shop,
      },
    });
    // move onboarding to next phase
    redisProvider.set(`onboarding:${userId}`, '3');

    return { shop, seller };
  });
}

export function getCategoriesService() {
  return categoryMap.getAll();
}

export async function getSellerShop(userId: string) {
  const seller = await dbProvider.getPrisma().sellers.findUnique({
    where: {
      userId: userId,
      user: {
        role: 'seller',
      },
    },
    include: {
      shop: {},
    },
  });

  const shop = seller?.shop
    ? {
        ...seller?.shop,
        createdAt: seller?.shop?.createdAt.toISOString(),
        updatedAt: seller?.shop?.updatedAt.toISOString(),
      }
    : {};
  return {
    ...seller,

    createdAt: seller?.createdAt.toISOString(),
    updatedAt: seller?.updatedAt.toISOString(),
    ...shop,
  };
}
