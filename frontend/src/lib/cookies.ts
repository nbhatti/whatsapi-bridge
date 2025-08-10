import { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG } from './auth-config';

export function setTokenCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  const accessTokenExpiry = new Date();
  accessTokenExpiry.setMinutes(accessTokenExpiry.getMinutes() + 15); // 15 minutes

  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

  response.cookies.set(AUTH_CONFIG.ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    ...AUTH_CONFIG.COOKIE_OPTIONS,
    expires: accessTokenExpiry,
  });

  response.cookies.set(AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...AUTH_CONFIG.COOKIE_OPTIONS,
    expires: refreshTokenExpiry,
  });
}

export function clearTokenCookies(response: NextResponse) {
  response.cookies.delete(AUTH_CONFIG.ACCESS_TOKEN_COOKIE_NAME);
  response.cookies.delete(AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME);
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // First, try to get token from cookie
  const cookieToken = request.cookies.get(AUTH_CONFIG.ACCESS_TOKEN_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Then try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_CONFIG.REFRESH_TOKEN_COOKIE_NAME)?.value || null;
}
