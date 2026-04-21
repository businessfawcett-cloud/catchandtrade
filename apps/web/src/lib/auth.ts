import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

function getSecret(envVar: string, name: string): Uint8Array {
  const value = process.env[envVar];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return new TextEncoder().encode(value);
}

function getJwtSecret() { return getSecret('JWT_SECRET', 'JWT_SECRET'); }
function getJwtRefreshSecret() { return getSecret('JWT_REFRESH_SECRET', 'JWT_REFRESH_SECRET'); }

export interface TokenPayload {
  userId: string;
  email: string;
}

export async function generateToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function generateRefreshToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtRefreshSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtRefreshSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');

  // Try JWT first
  const payload = await verifyToken(token);
  if (payload?.userId) return payload.userId;

  // Fallback: legacy base64 format
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    return decoded.split(':')[0] || null;
  } catch {
    return null;
  }
}
