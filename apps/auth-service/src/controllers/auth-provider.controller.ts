import type { Response, Request } from 'express';
import { nanoid } from 'nanoid';
import { config, dbProvider, kafkaProvider, redisProvider } from '../provider';
import type { IRequest } from '@eshopper/global-configuration';
import { asyncErrorHandler, BadRequestError } from '@eshopper/error-handler';
import { Redis } from '@eshopper/redis';
import { logger } from '@eshopper/logger';
import { InternalServerError } from '@eshopper/error-handler';
import { tokenProvider } from '../provider';
import { saveTokensToDatabase } from '../services/auth.service';
import { populateResponseWithTokens } from '@eshopper/auth';

import type {
  OAuthModes,
  OAuthState,
  OriginSite,
} from '@eshopper/shared-types';

// Store OAuth state in Redis
async function storeOAuthState(
  data: OAuthState & {
    expiry: number;
  },
  redis: Redis
) {
  try {
    const key = `oauth_state:${data.nonce}`;
    const value = JSON.stringify(data);

    // Set with automatic expiration

    await redis.setTTL(key, value, data.expiry);

    logger.info(`OAuth state stored: ${key} (expires in ${data.expiry}s)`);
    return true;
  } catch (error) {
    console.log(error);
    logger.error('Error storing OAuth state in Redis:', { error });
    throw new InternalServerError('Failed to store OAuth state');
  }
}

// Retrieve and delete OAuth state from Redis (single-use)
async function getAndDeleteOAuthState(
  nonce: string,
  redis: Redis,
  expiry: number
) {
  try {
    const key = `oauth_state:${nonce}`;

    // Get and delete in a single atomic operation
    const pipeline = (await redis.getRedisObject()).pipeline();
    pipeline.get(key);
    pipeline.del(key);
    const results = await pipeline.exec();

    if (!results || !results[0] || !results[0][1]) {
      return null;
    }

    const stateData = JSON.parse(results[0][1] as string);

    // Additional validation - check if not too old (extra safety)
    const maxAge = expiry * 1000; // Convert to milliseconds
    if (Date.now() - stateData.timestamp > maxAge) {
      return null;
    }

    return stateData;
  } catch (error) {
    logger.error('Error retrieving OAuth state from Redis:', { error });
    return null;
  }
}

const GOOGLE_SCOPE = ['openid', 'email', 'profile'].join(' ');

// Helper to build the Google OAuth URL
function getGoogleAuthUrl({ state }: { state: string }) {
  const params = new URLSearchParams({
    client_id: config.get('GOOGLE_CLIENT_ID'),
    redirect_uri: config.get('GOOGLE_OAUTH_REDIRECT_URL'),
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    state,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Controller to initiate Google OAuth
export const GoogleOAuthController = (redis: Redis) => {
  return asyncErrorHandler(async (req: IRequest, res: Response) => {
    try {
      const isAuthenticated = !!(req.user && req.account && req.session);
      // Read mode from query param, default to 'login'
      const mode = (req.query.mode as OAuthModes) || 'login';
      // Enforce correct usage
      if (mode === 'link' && !isAuthenticated) {
        throw new BadRequestError('Must be signed in to link account.');
      }

      const whichSite = req.headers['x-origin-site'] as OriginSite;
      // if ((mode === 'login' || mode === 'signup') && isAuthenticated) {
      //   return res.status(400).json({ error: 'Already signed in.' });
      // }
      if (whichSite === 'admin') {
        throw new BadRequestError('cannot create this type of role');
      }
      const expiry = 10 * 60; // 10 mins
      const reqUrl =
        whichSite === 'shopper'
          ? config.get('CLIENT_ORIGIN')
          : config.get('SELLER_ORIGIN');

      const stateData = {
        action: mode, // 'link', 'login', or 'signup'
        nonce: nanoid(),
        userId: isAuthenticated ? req.user!.id : undefined,
        timestamp: Date.now(),
        url: reqUrl,
        origin: whichSite,
      } as const;
      await storeOAuthState({ ...stateData, expiry }, redis);
      const googleAuthUrl = getGoogleAuthUrl({ state: stateData.nonce });
      logger.info('Starting Google OAuth', { googleAuthUrl });
      return res.status(200).json({
        data: googleAuthUrl,
      });
    } catch (error) {
      logger.error('Error in GoogleOAuthController', { error });
      throw new InternalServerError('Error in GoogleOAuthController', {
        error,
      });
    }
  });
};

// Callback controller for Google OAuth
export const GoogleOAuthCallbackController = async (
  req: Request,
  res: Response
) => {
  let redirectToClientLink = config.get('CLIENT_ORIGIN');
  try {
    const { code, state, error: googleError, error_description } = req.query;

    if (!code || !state) {
      logger.error('Missing OAuth parameters:', {
        hasCode: !!code,
        hasState: !!state,
        query: req.query,
      });
      return res.redirect(
        `${redirectToClientLink}/auth/sign-in?error=missing_parameters`
      );
    }

    // Retrieve and delete OAuth state from Redis (single-use)
    const stateData = await getAndDeleteOAuthState(
      state as string,
      redisProvider,
      10 * 60
    );
    if (!stateData) {
      logger.error('Invalid or expired OAuth state:', {
        state,
        timestamp: Date.now(),
      });
      return res.redirect(
        `${redirectToClientLink}/?error=invalid_or_expired_state`
      );
    }
    redirectToClientLink = stateData?.url || config.get('CLIENT_ORIGIN');
    // Handle Google OAuth errors
    if (googleError) {
      logger.error('Google OAuth error:', {
        error: googleError,
        description: error_description,
        query: req.query,
      });

      // Map Google OAuth errors to user-friendly messages
      let errorCode = 'oauth_error';
      switch (googleError) {
        case 'access_denied':
          errorCode = 'user_cancelled';
          break;
        case 'invalid_request':
          errorCode = 'invalid_request';
          break;
        case 'unauthorized_client':
          errorCode = 'unauthorized_client';
          break;
        case 'unsupported_response_type':
          errorCode = 'unsupported_response_type';
          break;
        case 'invalid_scope':
          errorCode = 'invalid_scope';
          break;
        case 'server_error':
          errorCode = 'google_server_error';
          break;
        case 'temporarily_unavailable':
          errorCode = 'google_temporarily_unavailable';
          break;
        default:
          errorCode = 'oauth_error';
      }

      return res.redirect(`${redirectToClientLink}/?error=${errorCode}`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.get('GOOGLE_CLIENT_ID'),
        client_secret: config.get('GOOGLE_CLIENT_SECRET'),
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: config.get('GOOGLE_OAUTH_REDIRECT_URL'),
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = (await tokenResponse.json().catch(() => ({}))) as any;
      logger.error('Token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData,
        code: code as string,
      });

      // Handle specific token exchange errors
      if (tokenResponse.status === 400) {
        if (errorData.error === 'invalid_grant') {
          return res.redirect(`${redirectToClientLink}/?error=invalid_grant`);
        }
        if (errorData.error === 'invalid_client') {
          return res.redirect(`${redirectToClientLink}/?error=invalid_client`);
        }
      }

      return res.redirect(
        `${redirectToClientLink}/?error=token_exchange_failed`
      );
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      id_token?: string;
    };

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      logger.error('Failed to get user info from Google:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
      });
      return res.redirect(`${redirectToClientLink}/?error=user_info_failed`);
    }

    const googleUser = (await userInfoResponse.json()) as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Validate required user data
    if (!googleUser.email) {
      logger.error('Google user missing email:', { googleUser });
      return res.redirect(`${redirectToClientLink}/?error=missing_email`);
    }

    // --- ENFORCE ONE USER PER EMAIL, STRICT LOGIN/SIGNUP MODES ---
    const emailOwnership = await dbProvider
      .getPrisma()
      .emailOwnership.findFirst({
        where: { email: googleUser.email },
      });
    let userId: string;
    const mode = stateData.action as OAuthModes;
    // --- LINKING ---
    if (mode === 'link') {
      // Linking: must be same user
      if (emailOwnership && emailOwnership.userId !== stateData.userId) {
        logger.warn('Email already owned by different user during linking:', {
          email: googleUser.email,
          currentUserId: stateData.userId,
          ownerUserId: emailOwnership.userId,
        });
        return res.redirect(
          `${redirectToClientLink}/?error=email_already_owned`
        );
      }
      userId = stateData.userId!;
      // Ensure EmailOwnership exists and is verified for this user
      if (!emailOwnership) {
        await dbProvider.getPrisma().emailOwnership.create({
          data: { email: googleUser.email, userId, isVerified: true },
        });
      } else {
        await dbProvider.getPrisma().emailOwnership.update({
          where: { email: googleUser.email },
          data: { isVerified: true },
        });
      }
      // Link or update Google account for this user
      let account = await dbProvider.getPrisma().account.findFirst({
        where: { userId, type: 'GOOGLE' },
      });
      if (account) {
        await dbProvider.getPrisma().account.update({
          where: { id: account.id },
          data: {
            email: googleUser.email,
            providerId: googleUser.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            tokenExpires: tokens.expires_in
              ? new Date(Date.now() + tokens.expires_in * 1000)
              : null,
          },
        });
      } else {
        account = await dbProvider.getPrisma().account.create({
          data: {
            userId,
            type: 'GOOGLE',
            email: googleUser.email,
            providerId: googleUser.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            tokenExpires: tokens.expires_in
              ? new Date(Date.now() + tokens.expires_in * 1000)
              : null,
          },
        });
      }
      // DO NOT create a new session or set new cookies!
      logger.info('Google account linked successfully:', {
        userId,
        email: googleUser.email,
      });
      return res.redirect(`${redirectToClientLink}/?linked=true`);
    }

    // --- STRICT LOGIN/SIGNUP ENFORCEMENT ---

    // Check if user already has a Google account for this email
    const existingGoogleAccount = await dbProvider
      .getPrisma()
      .account.findFirst({
        where: {
          email: googleUser.email,
          type: 'GOOGLE',
        },
        include: {
          user: {
            select: {
              role: true,
            },
          },
        },
      });

    if (mode === 'signup') {
      if (emailOwnership) {
        // Email is already owned, block signup!
        logger.warn('Signup blocked - email already owned:', {
          email: googleUser.email,
          ownerUserId: emailOwnership.userId,
        });
        return res.redirect(
          `${redirectToClientLink}/auth/sign-up?error=email_already_owned`
        );
      }
      // Create new user and EmailOwnership
      const origin = stateData.origin as OriginSite;
      if (origin === 'admin')
        return res.redirect(
          `${redirectToClientLink}/auth/sign-up?error=wrong-origin`
        );
      const newUser = await dbProvider.getPrisma().users.create({
        data: {
          emailOwnership: {
            create: [{ email: googleUser.email, isVerified: true }],
          },
          name: googleUser.name || googleUser.email,
          role: origin,
        },
      });
      userId = newUser.id;
      logger.info('New user created via Google OAuth:', {
        userId,
        email: googleUser.email,
      });
      if (newUser.role === 'seller') {
        await redisProvider.set(`onboarding:${userId}`, '2');
      }
      await kafkaProvider.sendMessage({
        topic: 'notifications',
        key: googleUser.email,
        value: JSON.stringify({
          type: 'EMAIL',
          channel: 'WELCOME_EMAIL',
          email: googleUser.email,
          userName: newUser.name,
        }),
      });
    } else if (mode === 'login') {
      if (!emailOwnership) {
        // No user with this email, block login!
        logger.warn('Login blocked - no account with email:', {
          email: googleUser.email,
        });
        return res.redirect(
          `${redirectToClientLink}/auth/sign-in?error=no_account_with_email`
        );
      }

      // For login, we need to check if this is the right authentication method
      if (existingGoogleAccount) {
        const origin = stateData.origin as OriginSite;
        if (origin === 'admin')
          return res.redirect(
            `${redirectToClientLink}/auth/sign-in?error=wrong-origin`
          );
        if (
          origin === 'seller' &&
          existingGoogleAccount.user.role === 'shopper'
        ) {
          return res.redirect(
            `${redirectToClientLink}/auth/sign-in?error=invalid-role`
          );
        }

        // User has Google account, allow login

        userId = existingGoogleAccount.userId;
      } else {
        // User exists but doesn't have Google account - they should use their original auth method
        logger.warn('Login blocked - user exists but no Google account:', {
          email: googleUser.email,
          userId: emailOwnership.userId,
        });
        return res.redirect(
          `${redirectToClientLink}/auth/sign-in?error=use_original_auth_method`
        );
      }

      await dbProvider.getPrisma().emailOwnership.update({
        where: { email: googleUser.email },
        data: { isVerified: true },
      });
      logger.info('User logged in via Google OAuth:', {
        userId,
        email: googleUser.email,
      });
    } else {
      // Unknown mode
      logger.error('Unknown OAuth mode:', { mode, stateData });
      return res.redirect(`${redirectToClientLink}/?error=invalid_mode`);
    }

    // --- ENSURE ONLY ONE GOOGLE ACCOUNT PER USER ---
    let account = await dbProvider.getPrisma().account.findFirst({
      where: { userId, type: 'GOOGLE' },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });
    if (account) {
      await dbProvider.getPrisma().account.update({
        where: { id: account.id },
        data: {
          email: googleUser.email,
          providerId: googleUser.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenExpires: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : null,
        },
        include: {
          user: {
            select: {
              role: true,
            },
          },
        },
      });
    } else {
      account = await dbProvider.getPrisma().account.create({
        data: {
          userId,
          type: 'GOOGLE',
          email: googleUser.email,
          providerId: googleUser.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenExpires: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : null,
        },
        include: {
          user: {
            select: {
              role: true,
            },
          },
        },
      });
    }

    // --- GENERATE TOKENS, CREATE SESSION, SET COOKIES (ONLY FOR LOGIN/SIGNUP) ---
    const tokenPair = await tokenProvider.generateTokens({
      data: { userId, accountId: account.id, role: account.user.role },
      options: {},
    });
    await saveTokensToDatabase(
      tokenPair.accessToken,
      tokenPair.refreshToken,
      userId,
      req.headers['user-agent'] || '',
      req.ip || req.socket.remoteAddress || '',
      account.id
    );
    const origin = stateData.origin;
    populateResponseWithTokens(
      {
        name: 'accessToken',
        value: tokenPair.accessToken,
      },
      {
        name: 'refreshToken',
        value: tokenPair.refreshToken,
      },
      {
        setCookie: (name, value, options) => {
          res.cookie(name, value, options);
        },
        clearCookie: (name) => {
          res.clearCookie(name);
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        },
        domain: origin,
      }
    );

    // Redirect based on mode
    logger.info('OAuth flow completed successfully:', {
      mode,
      userId,
      email: googleUser.email,
    });

    if (mode === 'signup') {
      return res.redirect(`${redirectToClientLink}/?success=true&mode=signup`);
    } else {
      return res.redirect(`${redirectToClientLink}/?success=true&mode=login`);
    }
  } catch (error) {
    logger.error('Error in Google OAuth callback:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      query: req.query,
    });
    return res.redirect(`${redirectToClientLink}/?error=callback_error`);
  }
};
