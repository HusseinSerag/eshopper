import type { OAuthError } from '@eshopper/shared-types';

export type { OAuthError };

export const OAUTH_ERROR_MESSAGES: Record<string, OAuthError> = {
  // Google OAuth errors
  user_cancelled: {
    code: 'user_cancelled',
    message: 'Authentication was cancelled',
    description: 'You cancelled the Google sign-in process.',
    action: 'Please try signing in again.',
  },
  invalid_request: {
    code: 'invalid_request',
    message: 'Invalid request',
    description: 'The authentication request was invalid.',
    action: 'Please try again or contact support if the problem persists.',
  },
  unauthorized_client: {
    code: 'unauthorized_client',
    message: 'Unauthorized client',
    description:
      'This application is not authorized to perform Google sign-in.',
    action: 'Please contact support.',
  },
  unsupported_response_type: {
    code: 'unsupported_response_type',
    message: 'Unsupported response type',
    description: 'The authentication response type is not supported.',
    action: 'Please try again or contact support.',
  },
  invalid_scope: {
    code: 'invalid_scope',
    message: 'Invalid scope',
    description: 'The requested permissions are invalid.',
    action: 'Please try again or contact support.',
  },
  google_server_error: {
    code: 'google_server_error',
    message: 'Google server error',
    description: "Google's servers are experiencing issues.",
    action: 'Please try again in a few minutes.',
  },
  google_temporarily_unavailable: {
    code: 'google_temporarily_unavailable',
    message: 'Google temporarily unavailable',
    description: "Google's authentication service is temporarily unavailable.",
    action: 'Please try again in a few minutes.',
  },
  oauth_error: {
    code: 'oauth_error',
    message: 'Authentication error',
    description: 'An error occurred during the authentication process.',
    action: 'Please try again or contact support if the problem persists.',
  },

  // Token exchange errors
  invalid_grant: {
    code: 'invalid_grant',
    message: 'Invalid authorization code',
    description: 'The authorization code is invalid or has expired.',
    action: 'Please try signing in again.',
  },
  invalid_client: {
    code: 'invalid_client',
    message: 'Invalid client configuration',
    description: 'There is an issue with the application configuration.',
    action: 'Please contact support.',
  },
  token_exchange_failed: {
    code: 'token_exchange_failed',
    message: 'Token exchange failed',
    description: 'Failed to exchange the authorization code for access tokens.',
    action: 'Please try again or contact support.',
  },

  // User info errors
  user_info_failed: {
    code: 'user_info_failed',
    message: 'Failed to get user information',
    description: 'Unable to retrieve your information from Google.',
    action: 'Please try again or contact support.',
  },
  missing_email: {
    code: 'missing_email',
    message: 'Email address required',
    description: 'Your Google account must have an email address to continue.',
    action: 'Please add an email address to your Google account and try again.',
  },

  // State and parameter errors
  missing_parameters: {
    code: 'missing_parameters',
    message: 'Missing parameters',
    description: 'Required authentication parameters are missing.',
    action: 'Please try signing in again.',
  },
  invalid_or_expired_state: {
    code: 'invalid_or_expired_state',
    message: 'Session expired',
    description: 'Your authentication session has expired.',
    action: 'Please try signing in again.',
  },

  // Business logic errors
  email_already_owned: {
    code: 'email_already_owned',
    message: 'Email already registered',
    description:
      'This email address is already associated with another account.',
    action:
      'Please sign in with your existing account or use a different email.',
  },
  no_account_with_email: {
    code: 'no_account_with_email',
    message: 'No account found',
    description: 'No account was found with this email address.',
    action: 'Please create a new account or check your email address.',
  },
  use_original_auth_method: {
    code: 'use_original_auth_method',
    message: 'Use original sign-in method',
    description: 'This account was created with a different sign-in method.',
    action: 'Please sign in using your original authentication method.',
  },
  invalid_mode: {
    code: 'invalid_mode',
    message: 'Invalid authentication mode',
    description: 'The authentication mode is not valid.',
    action: 'Please try signing in again.',
  },

  // General errors
  callback_error: {
    code: 'callback_error',
    message: 'Authentication failed',
    description: 'An unexpected error occurred during authentication.',
    action: 'Please try again or contact support if the problem persists.',
  },
};

export function getOAuthError(errorCode: string | null): OAuthError {
  if (!errorCode) {
    return {
      code: 'unknown_error',
      message: 'Unknown error',
      description: 'An unknown error occurred.',
      action: 'Please try again or contact support.',
    };
  }

  return (
    OAUTH_ERROR_MESSAGES[errorCode] || {
      code: errorCode,
      message: 'Authentication error',
      description: `An error occurred: ${errorCode}`,
      action: 'Please try again or contact support.',
    }
  );
}

export function isRetryableError(errorCode: string): boolean {
  const retryableErrors = [
    'user_cancelled',
    'google_server_error',
    'google_temporarily_unavailable',
    'token_exchange_failed',
    'user_info_failed',
    'missing_parameters',
    'invalid_or_expired_state',
    'callback_error',
  ];

  return retryableErrors.includes(errorCode);
}

export function shouldShowRetryButton(errorCode: string): boolean {
  const showRetryErrors = [
    'user_cancelled',
    'google_server_error',
    'google_temporarily_unavailable',
    'token_exchange_failed',
    'user_info_failed',
    'missing_parameters',
    'invalid_or_expired_state',
    'callback_error',
  ];

  return showRetryErrors.includes(errorCode);
}
