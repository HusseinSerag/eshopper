import z from 'zod';
import { CreateSellerSchema } from '../schema/onboarding.schema';

type SubmittedShop = Omit<
  z.infer<typeof CreateSellerSchema>['shop'],
  'category'
> & {
  categoryId: string;
};
export type CreateShop = Omit<z.infer<typeof CreateSellerSchema>, 'shop'> & {
  shop: SubmittedShop;
};
