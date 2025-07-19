import { useSendNewPasswordRequest } from '@/modules/reset-password/hooks/useSendPassword';
import { axiosClient } from '@/utils/axios';
import { getAuthClient, RequestError } from '@eshopper/client-auth';
import { ResetPasswordView } from '@eshopper/ui';
import { ErrorComponent } from '@eshopper/ui';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params['token'];

  if (!token || typeof token !== 'string') {
    return (
      <ErrorComponent
        message="Reset Link Invalid"
        description="The password reset link is missing or malformed. Please make sure you used the correct link from your email."
      />
    );
  }

  const client = getAuthClient(axiosClient);

  try {
    await client.request({
      url: `/auth/seller/verify-reset-password-token?token=${token}`,
      method: 'post',
    });

    return (
      <ResetPasswordView
        redirectUrl="/auth/sign-in"
        useMutation={useSendNewPasswordRequest}
      />
    );
  } catch (e) {
    if (e instanceof RequestError) {
      return (
        <ErrorComponent
          message={e.message}
          description="We couldn't verify your reset password link. Please try requesting a new one."
        />
      );
    }

    return (
      <ErrorComponent
        message="Something Went Wrong"
        description="We encountered an unexpected error while verifying your reset link. Please try again later or contact support."
      />
    );
  }
}
