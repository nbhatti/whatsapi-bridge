export const AUTH_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.JWT_SECRET || 'default-access-secret',
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  ACCESS_TOKEN_COOKIE_NAME: 'access_token',
  REFRESH_TOKEN_COOKIE_NAME: 'refresh_token',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
} as const;

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
