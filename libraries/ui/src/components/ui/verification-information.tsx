import { VerificationInfoResponse } from '@eshopper/shared-types';
import { useCountdown } from './../../hooks/useCountdown';
import { Button } from './button';
interface Props {
  data: VerificationInfoResponse;
  onResend(): void;
  title?: string;
}
export function VerificationInfoComponent({
  data,
  onResend,
  title = 'Email',
}: Props) {
  const { cooldown, minutes, seconds } = useCountdown(data.cooldown);

  const { maxResendRequests, maxInvalidOTP, newRequestWindow } = data;

  const triesLeft = maxInvalidOTP - data.invalidOtpCount;
  return (
    <div>
      {cooldown > 0 &&
        maxResendRequests !== data.numberOfRequestsPerWindow &&
        !(maxResendRequests <= data.numberOfRequestsPerWindow) && (
          <div className="text-sm text-foreground">
            Please wait {minutes}:{seconds} before requesting another OTP
          </div>
        )}
      {cooldown <= 0 && data.numberOfRequestsPerWindow < maxResendRequests && (
        <Button onClick={onResend} type="button" variant="link">
          Resend {title}
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
