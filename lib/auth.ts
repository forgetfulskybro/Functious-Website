import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { FluxerGuild, Session } from './types';

const SESSION_COOKIE = 'functious_session';
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET
);

export const FLUXER_API = 'https://api.fluxer.app/v1';
export const FLUXER_OAUTH_BASE = 'https://web.fluxer.app/oauth2/authorize';

export async function createSession(session: Session): Promise<string> {
  const token = await new SignJWT({ session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return token;
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
      console.log('[getSession] No session cookie found');
      return null;
    }

    const { payload } = await jwtVerify(token, secret);
    return (payload as { session: Session }).session;
  } catch (err) {
    console.log('[getSession] JWT verification failed:', err);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionGuilds(accessToken: string): Promise<FluxerGuild[]> {
  try {
    const res = await fetch(`${FLUXER_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function getOAuthUrl(): string {
  const clientId = process.env.FLUXER_CLIENT_ID!;
  const redirectUri = encodeURIComponent(process.env.FLUXER_REDIRECT_URI!);

  return `${FLUXER_OAUTH_BASE}?client_id=${clientId}&scope=identify+guilds&redirect_uri=${redirectUri}&response_type=code`;
}
