import { useAuthenticatedQuery } from '@eshopper/client-auth/client';
import { SellerForm } from './seller-form';
import { SellerWithShop } from '@eshopper/shared-types';
import { CreateSellerSchema } from '../../schema/onboarding.schema';
import z from 'zod';
import { Loader } from '@eshopper/ui';

interface Props {
  setSteps: (step: number) => void;
  currentSteps: number;
}
export function SellerFormWrapper({ setSteps, currentSteps }: Props) {
  const { data, isPending } = useAuthenticatedQuery<{
    data: SellerWithShop | null;
  }>(['shop-info'], '/shop');
  if (isPending) {
    return <Loader />;
  }
  let defaultValues: z.infer<typeof CreateSellerSchema>;

  if (data && data.data?.userId)
    defaultValues = {
      country: data.data.country,
      shop: {
        address: data.data.shop?.address || '',
        bio: data.data.shop?.bio || '',
        name: data.data.shop?.name || '',
        website: data.data.shop?.website || '',
        otherCategory: data.data.shop?.otherCategory || '',
        opening_hours: data.data.shop!.opening_hours!,
        category: data.data.shop?.categoryId || '',
      },
    };

  function onSuccess() {
    setSteps(currentSteps + 1);
  }
  function onNext() {
    setSteps(currentSteps + 1);
  }
  return (
    <SellerForm
      onNext={onNext}
      onSuccess={onSuccess}
      defaultValues={data && data.data ? defaultValues! : undefined}
    />
  );
}
