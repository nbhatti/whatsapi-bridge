import { jwtVerify, SignJWT } from 'jose'
import { AUTH_CONFIG, Role } from './auth-config'

export interface EdgeTokenPayload {
  userId: string
  email: string
  role: Role
  jwtId?: string
  iat?: number
  exp?: number
}

// Convert string secret to Uint8Array for Jose
const getSecretKey = (secret: string): Uint8Array => {
  return new TextEncoder().encode(secret)
}

export async function verifyAccessTokenEdge(token: string): Promise<EdgeTokenPayload | null> {
  try {
    const secretKey = getSecretKey(AUTH_CONFIG.ACCESS_TOKEN_SECRET)
    const { payload } = await jwtVerify(token, secretKey)
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as Role,
      jwtId: payload.jwtId as string | undefined,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch (error) {
    return null;
  }
}

export async function generateAccessTokenEdge(payload: Omit<EdgeTokenPayload, 'iat' | 'exp'>): Promise<string> {
  const secretKey = getSecretKey(AUTH_CONFIG.ACCESS_TOKEN_SECRET)
  
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    ...(payload.jwtId && { jwtId: payload.jwtId }),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secretKey)
}

export async function verifyRefreshTokenEdge(token: string): Promise<EdgeTokenPayload | null> {
  try {
    const secretKey = getSecretKey(AUTH_CONFIG.REFRESH_TOKEN_SECRET)
    const { payload } = await jwtVerify(token, secretKey)
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as Role,
      jwtId: payload.jwtId as string | undefined,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch (error) {
    return null
  }
}
