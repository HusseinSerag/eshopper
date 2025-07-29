import { AxiosClient } from '@eshopper/utils/client';
import { BaseUser, ErrorResponse, ShopperUser } from '@eshopper/shared-types';
import { AxiosError, Axios } from 'axios';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';

type ResponseObject =
  | { success: true; user: ShopperUser; refreshed: false }
  | { success: false; user: null }
  | {
      success: true;
      user: null;
      isBlocked: true;
      refreshed: false;
    }
  | {
      success: true;
      user: null;
      isBlocked: true;
      refreshed: true;
      accessToken: string;
      refreshToken: string;
    }
  | {
      success: true;
      user: ShopperUser;
      isBlocked: false;
      refreshed: true;
      accessToken: string;
      refreshToken: string;
    };

// Add a unique identifier for each call

export const getAuth = cache(
  async (axios: AxiosClient, meLink: string): Promise<ResponseObject> => {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const headersInstance = await headers();
    const headersObj: Record<string, any> = {};

    headersInstance.forEach((value, key) => {
      headersObj[key] = value;
    });

    headersObj['cookie'] = cookieHeader;

    try {
      const getMeRes = await axios.getInstance().request({
        url: meLink,
        headers: headersObj,
      });
      return {
        success: true,
        refreshed: false,
        user: (getMeRes.data as { user: BaseUser }).user,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as ErrorResponse;

        if (error.response?.status === 401 && errorData.resCode === 5000) {
          return {
            success: true,
            isBlocked: true,
            user: null,
            refreshed: false,
          };
        }

        if (error.response?.status === 401 && errorData.resCode === 4011) {
          let accessToken = '';
          let refreshToken = '';

          try {
            const refreshRes = await axios.getInstance().post(
              '/auth/refresh',
              {},
              {
                headers: headersObj, // Use all headers consistently
              }
            );

            // Extract new cookies from refresh response
            const setCookieHeaders = refreshRes.headers['set-cookie'];
            let newCookieHeader = cookieHeader; // fallback to original

            if (setCookieHeaders) {
              // Parse set-cookie headers and create new cookie string
              const cookiePairs = setCookieHeaders.map(
                (cookie) => cookie.split(';')[0]
              );
              newCookieHeader = cookiePairs.join('; ');

              // Extract specific token values
              cookiePairs.forEach((pair) => {
                const [name, value] = pair.split('=');
                if (name.trim() === 'accessToken') {
                  accessToken = value;
                } else if (name.trim() === 'refreshToken') {
                  refreshToken = value;
                }
              });
            }

            // If refresh succeeds, try the original request again
            const retryRes = await axios.getInstance().request({
              method: 'GET',
              url: meLink,
              headers: {
                ...headersObj,
                cookie: newCookieHeader,
              },
            });

            return {
              success: true,
              refreshed: true,
              accessToken: accessToken,
              refreshToken: refreshToken,
              user: (retryRes.data as { user: ShopperUser }).user,
              isBlocked: false,
            };
          } catch (err2) {
            // Refresh failed, return failure
            if (err2 instanceof AxiosError) {
              const errorData = err2.response?.data as ErrorResponse;
              if (err2.response?.status === 401 && errorData.resCode === 5000) {
                return {
                  success: true,
                  refreshed: true,
                  accessToken: accessToken,
                  refreshToken: refreshToken,
                  isBlocked: true,
                  user: null,
                };
              }

              return { success: false, user: null };
            }
          }
        }
      }
    }

    return {
      success: false,
      user: null,
    };
  }
);
