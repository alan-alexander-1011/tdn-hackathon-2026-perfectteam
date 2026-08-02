// Lightweight, stateless admin session handling -- no session table needed.
// The cookie value is "<expiryTimestamp>.<hmacSignature>", signed with
// ADMIN_SESSION_SECRET. Uses Web Crypto (crypto.subtle) so it works in both
// the Edge middleware runtime and normal Node.js route handlers.

export const ADMIN_COOKIE_NAME = 'admin_session';

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('Missing ADMIN_SESSION_SECRET environment variable');
  }
  return secret;
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toHex(sig);
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_TTL_MS;
  const sig = await hmac(getSecret(), String(expires));
  return `${expires}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [expiresStr, sig] = token.split('.');
  if (!expiresStr || !sig) return false;

  const expires = Number(expiresStr);
  if (!expires || Number.isNaN(expires) || Date.now() > expires) return false;

  try {
    const expected = await hmac(getSecret(), expiresStr);
    return expected === sig;
  } catch {
    return false;
  }
}

// Convenience for Route Handlers: reads the cookie straight off the request.
export async function isAdminRequest(req: Request): Promise<boolean> {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
  return verifySessionToken(match?.[1]);
}
