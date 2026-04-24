import * as crypto from 'crypto';

export interface JwtPayload {
  sub: string;
  username: string;
  permissions: string;
  /** tokenVersion au moment de l'émission — permet de détecter les tokens invalidés côté utilisateur */
  version: number;
  iat?: number;
  exp?: number;
}

function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  return Buffer.from(padded + padding, 'base64').toString('utf8');
}

function hmacSha256Base64url(secret: string, data: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function signCustomJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  key: string,
  expiresInSeconds = 900,
): string {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const signingInput = `${header}.${encodedPayload}`;
  const signature = hmacSha256Base64url(key, signingInput);
  return `${signingInput}.${signature}`;
}

export function verifyCustomJwt(token: string, key: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = hmacSha256Base64url(key, `${encodedHeader}.${encodedPayload}`);

  // Comparaison en temps constant pour éviter les timing attacks
  const sigBuf = Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const expBuf = Buffer.from(expectedSignature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Invalid JWT signature');
  }

  const decoded: JwtPayload = JSON.parse(base64urlDecode(encodedPayload));
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp !== undefined && decoded.exp < now) {
    throw new Error('JWT expired');
  }

  return decoded;
}
