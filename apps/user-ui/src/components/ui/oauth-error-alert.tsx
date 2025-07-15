import { Alert, AlertDescription, AlertTitle, cn } from '@eshopper/ui';
import { Button } from '@eshopper/ui';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import {
  getOAuthError,
  shouldShowRetryButton,
} from '@/utils/oauth-error-handler';

interface OAuthErrorAlertProps {
  errorCode: string | null;
  onRetry?: () => void;
  className?: string;
}

export function OAuthErrorAlert({
  errorCode,
  onRetry,
  className,
}: OAuthErrorAlertProps) {
  if (!errorCode) return null;

  const error = getOAuthError(errorCode);
  const showRetry = shouldShowRetryButton(errorCode) && onRetry;

  return (
    <Alert
      className={cn(`flex flex-col gap-3`, className)}
      variant="destructive"
    >
      <div className="flex items-start gap-3">
        <AlertCircleIcon className="size-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <AlertTitle className="text-base font-semibold">
            {error.message}
          </AlertTitle>
          {error.description && (
            <AlertDescription className="mt-1 text-sm">
              {error.description}
            </AlertDescription>
          )}
          {error.action && (
            <AlertDescription className="mt-2 text-sm font-medium">
              {error.action}
            </AlertDescription>
          )}
        </div>
      </div>

      {showRetry && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <RefreshCwIcon className="size-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </Alert>
  );
}
