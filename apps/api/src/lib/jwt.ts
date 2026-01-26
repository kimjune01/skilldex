import { SignJWT, jwtVerify } from 'jose';
import type { UserPublic } from '@skillomatic/shared';

/**
 * Get JWT secret with production safety check.
 *
 * SECURITY: In production, JWT_SECRET must be explicitly set.
 * Using a default secret would allow token forgery.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  // Fail fast in production if JWT_SECRET is not set
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL: JWT_SECRET environment variable must be set in production. ' +
        'Refusing to start with default secret as this would allow token forgery.'
    );
  }

  // Warn in development if using default secret
  if (!secret) {
    console.warn(
      '[Security] JWT_SECRET not set - using default secret. ' +
        'This is only acceptable in development.'
    );
  }

  return new TextEncoder().encode(
    secret || 'your-jwt-secret-here-change-in-production'
  );
}

const JWT_SECRET = getJwtSecret();

const JWT_ISSUER = 'skillomatic';
const JWT_AUDIENCE = 'skillomatic-api';
const JWT_EXPIRATION = '7d';

export interface JWTPayload {
  sub: string; // user id
  id: string; // alias for sub
  email: string;
  name: string;
  isAdmin: boolean; // Org admin
  isSuperAdmin: boolean; // System-wide super admin
  organizationId: string | null; // User's organization
}

export async function createToken(user: UserPublic): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin ?? false,
    organizationId: user.organizationId ?? null,
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
      isSuperAdmin: (payload.isSuperAdmin as boolean) ?? false,
      organizationId: (payload.organizationId as string) ?? null,
    };
  } catch {
    return null;
  }
}
