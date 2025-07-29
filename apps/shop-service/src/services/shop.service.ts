import z from 'zod';
import { dbProvider, redisProvider, stripeClient } from '../provider';
import { CreateSellerSchema } from '../schemas/shop.schema';
import { categoryMap } from '../data';
import { BadRequestError } from '@eshopper/error-handler';
import { Seller, Shop } from '@eshopper/database';
import { logger } from '@eshopper/logger';
import { StripeClient, withRetry } from '@eshopper/utils';

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

export async function retrieveStripeInfo(stripeId: string) {
  const account = await stripeClient.getInstance().accounts.retrieve(stripeId);
  if (!account)
    throw new BadRequestError('No Stripe Account please create one first');
  return account;
}
export async function createStripeAccountService(
  email: string,
  seller: Seller & { shop: Shop | null },
  options: {
    retryCount?: number;
    timeoutMs?: number;
  } = {}
) {
  const { timeoutMs = 30000 } = options;
  const operationId = crypto.randomUUID();

  logger?.info('Starting Stripe account creation', {
    operationId,
    sellerId: seller.id,
    email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email for privacy
  });

  // Check if seller already has a Stripe account
  if (seller.stripeId) {
    logger?.info('Seller already has Stripe account', {
      operationId,
      sellerId: seller.id,
      stripeId: seller.stripeId,
    });

    // Try to create onboarding link for existing account
    try {
      const onboardingLink = await createAccountSession(seller.stripeId);
      return {
        success: true,
        data: {
          accountId: seller.stripeId,
          client_secret: onboardingLink.client_secret,
          isExisting: true,
        },
      };
    } catch (error: any) {
      logger?.warn('Failed to create onboarding link for existing account', {
        operationId,
        sellerId: seller.id,
        stripeId: seller.stripeId,
        error: error.message,
      });
      // Continue to create new account if existing one is invalid
    }
  }

  // Validate country support
  const country = seller.country || 'US';
  if (!StripeClient.SUPPORTED_COUNTRIES.includes(country)) {
    throw new BadRequestError(
      `Country ${country} is not supported for Stripe Express accounts`
    );
  }

  // Create operation with timeout
  const result = await Promise.race([
    executeAccountCreation(
      {
        email,
        seller,
      },
      operationId
    ),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ]);

  logger?.info('Stripe account creation completed successfully', {
    operationId,
    sellerId: seller.id,
    accountId: result.data.accountId,
  });

  return result;
}

async function executeAccountCreation(
  input: {
    email: string;
    seller: Seller & {
      shop: Shop | null;
    };
  },
  operationId: string
) {
  const { email, seller } = input;
  const country = seller.country || 'US';

  // Step 1: Create Stripe account with retry logic
  const account = await withRetry(async () => {
    try {
      const websiteURL = seller.shop?.website
        ? seller.shop?.website.startsWith('http://') ||
          seller.shop?.website.startsWith('https://')
          ? seller.shop?.website
          : `https://${seller.shop?.website}`
        : '';
      return await stripeClient.getInstance().accounts.create({
        type: 'express',
        country,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: seller.shop?.name,
          url: websiteURL,
        },
        metadata: {
          userId: seller.userId,
          sellerId: seller.id,
          operationId,
          createdAt: Date.now().toString(),
        },
        email,
      });
    } catch (error: any) {
      logger?.error('Stripe account creation API call failed', {
        operationId,
        sellerId: seller.id,
        error: error.message,
      });
      throw new BadRequestError(
        `Failed to create Stripe account: ${error.message}`,
        error
      );
    }
  }, 3);

  // Step 2: Update database with transaction safety
  await withRetry(async () => {
    try {
      await dbProvider.getPrisma().$transaction(async (tx) => {
        // Check if another process already updated this seller
        const currentSeller = await tx.sellers.findUnique({
          where: { id: seller.id },
          select: { stripeId: true },
        });

        if (currentSeller?.stripeId && currentSeller.stripeId !== account.id) {
          throw new Error('Seller already has a different Stripe account');
        }

        await tx.sellers.update({
          where: { id: seller.id },
          data: {
            stripeId: account.id,
            updatedAt: new Date(),
          },
        });
      });
    } catch (error: any) {
      logger?.error('Database update failed', {
        operationId,
        sellerId: seller.id,
        accountId: account.id,
        error: error.message,
      });

      // If database update fails, we should clean up the Stripe account
      try {
        await stripeClient.getInstance().accounts.del(account.id);
        logger?.info('Cleaned up Stripe account after database failure', {
          operationId,
          accountId: account.id,
        });
      } catch (cleanupError: any) {
        logger?.error('Failed to cleanup Stripe account', {
          operationId,
          accountId: account.id,
          cleanupError: cleanupError.message,
        });
      }

      throw new BadRequestError(
        `Failed to update seller with Stripe account ID: ${error.message}`,
        error
      );
    }
  }, 2);

  // Step 3: Create onboarding link
  const onboardingLink = await createAccountSession(account.id, operationId);

  return {
    success: true,
    data: {
      accountId: account.id,
      client_secret: onboardingLink.client_secret,
      isExisting: false,
    },
  };
}

async function createAccountSession(accountId: string, operationId?: string) {
  return withRetry(async () => {
    try {
      return await stripeClient.getInstance().accountSessions.create({
        account: accountId,

        components: {
          account_onboarding: {
            enabled: true,
          },
        },
      });
    } catch (error: any) {
      throw new BadRequestError(
        `Failed to create onboarding link: ${error.message}`,
        error
      );
    }
  }, 3);
}
