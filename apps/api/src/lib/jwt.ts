import { SignJWT, jwtVerify } from 'jose';
import type { UserPublic } from '@skilldex/shared';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
);

const JWT_ISSUER = 'skilldex';
const JWT_AUDIENCE = 'skilldex-api';
const JWT_EXPIRATION = '7d';

export interface JWTPayload {
  sub: string; // user id
  id: string; // alias for sub
  email: string;
  name: string;
  isAdmin: boolean;
}

export async function createToken(user: UserPublic): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(user.id)
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const sub = payload.sub as string;
    return {
      sub,
      id: sub, // alias for convenience
      email: payload.email as string,
      name: payload.name as string,
      isAdmin: payload.isAdmin as boolean,
    };
  } catch {
    return null;
  }
}
