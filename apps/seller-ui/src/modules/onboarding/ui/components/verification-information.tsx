import { useAuthenticatedQuery } from '@eshopper/client-auth/client';
import { VerificationInfoResponse } from '@eshopper/shared-types';
import { VerificationInfoComponent } from '@eshopper/ui';

export function VerificationInformation({ onResend }: { onResend(): void }) {
  const { data } = useAuthenticatedQuery<{ data: VerificationInfoResponse }>(
    ['verification'],
    '/auth/verification-info'
  );
  if (!data?.data) return null;
  return <VerificationInfoComponent onResend={onResend} data={data.data} />;
}
