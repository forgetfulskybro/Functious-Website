import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import type { FluxerUser, FluxerGuild, Session } from '@/lib/types';

const SESSION_COOKIE = 'functious_session';
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET
);

const BOT_API_URL = process.env.BOT_API_URL ?? 'http://localhost:4000';
const BOT_API_KEY = process.env.BOT_API_KEY ?? '';

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ reason: 'denied' }, { status: 400 });
  }

  try {
    const botRes = await fetch(`${BOT_API_URL}/api/oauth/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BOT_API_KEY,
      },
      body: JSON.stringify({ code }),
    });

    if (!botRes.ok) {
      const body = await botRes.text();
      console.error('[auth/exchange] Bot exchange failed:', botRes.status, body);
      return NextResponse.json({ reason: 'token' }, { status: 502 });
    }

    const { accessToken, user } = await botRes.json() as {
      accessToken: string;
      user: FluxerUser;
      guilds: FluxerGuild[];
    };
 
    const session: Session = { user, accessToken };

    const token = await new SignJWT({ session })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log('[exchange] Session cookie set, token length:', token.length);
    return res;
  } catch (err) {
    console.error('[auth/exchange] Unexpected error:', err);
    return NextResponse.json({ reason: 'unknown' }, { status: 500 });
  }
}
