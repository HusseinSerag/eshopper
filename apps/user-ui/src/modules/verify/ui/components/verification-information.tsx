import { useAuthenticatedQuery } from '@eshopper/client-auth/client';
import { VerificationInfoResponse } from '@eshopper/shared-types';
import { Button, useCountdown } from '@eshopper/ui';

interface Props {
  data: VerificationInfoResponse;
  onResend(): void;
}
function Component({ data, onResend }: Props) {
  const { cooldown, minutes, seconds } = useCountdown(data.cooldown);

  const { maxResendRequests, maxInvalidOTP, newRequestWindow } = data;

  const triesLeft = maxInvalidOTP - data.invalidOtpCount;
  return (
    <div>
      {cooldown > 0 && maxResendRequests !== data.numberOfRequestsPerWindow && (
        <div className="text-sm text-foreground">
          Please wait {minutes}:{seconds} before requesting another OTP
        </div>
      )}
      {cooldown <= 0 && data.numberOfRequestsPerWindow < maxResendRequests && (
        <Button onClick={onResend} type="button" variant="link">
          Resend Email
        </Button>
      )}
      {maxResendRequests <= data.numberOfRequestsPerWindow && (
        <ResendWindowComponent newRequestWindow={newRequestWindow} />
      )}
      {data.numberOfRequestsPerWindow < maxResendRequests &&
        triesLeft <= 3 &&
        triesLeft != 0 && (
          <div className="text-sm font-semibold text-red-600">
            {triesLeft} tr{triesLeft === 1 ? 'y' : 'ies'} left
          </div>
        )}
    </div>
  );
}
function ResendWindowComponent({
  newRequestWindow,
}: {
  newRequestWindow: number;
}) {
  const { minutes, hours, seconds } = useCountdown(newRequestWindow);
  return (
    <div className="text-sm font-semibold">
      You have sent too many requests Please wait {hours} : {minutes} :{' '}
      {seconds} before requesting again
    </div>
  );
}
export function VerificationInformation({ onResend }: { onResend(): void }) {
  const { data } = useAuthenticatedQuery<{ data: VerificationInfoResponse }>(
    ['verification'],
    '/auth/verification-info'
  );
  if (!data?.data) return null;
  return <Component onResend={onResend} data={data.data} />;
}
