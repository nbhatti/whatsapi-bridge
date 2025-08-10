import { sign, verify, JwtPayload } from 'jsonwebtoken';
import { AUTH_CONFIG, Role } from './auth-config';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: Role;
  jwtId?: string;
}

export function generateAccessToken(payload: Omit<TokenPayload, 'jwtId'>): string {
  return sign(payload, AUTH_CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function generateRefreshToken(payload: Omit<TokenPayload, 'jwtId'> & { jwtId: string }): string {
  return sign(payload, AUTH_CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return verify(token, AUTH_CONFIG.ACCESS_TOKEN_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return verify(token, AUTH_CONFIG.REFRESH_TOKEN_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
