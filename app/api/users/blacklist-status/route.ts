import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BOT_API_URL = process.env.BOT_API_URL ?? 'http://localhost:4000';
const BOT_API_KEY = process.env.BOT_API_KEY ?? '';

async function botFetch(url: string) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': BOT_API_KEY },
    cache: 'no-store',
  });
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Bot API returned non-JSON response (status ${res.status}).`);
  }
  return res;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const raw = req.nextUrl.searchParams.get('guilds') ?? '';
  const guildIds = [...new Set(raw.split(',').map((s) => s.trim()).filter((s) => s))];
  const valid = guildIds.filter((id) => /^\d{17,20}$/.test(id));
  if (valid.length === 0) return NextResponse.json({ blacklisted: {} });

  try {
    const res = await botFetch(
      `${BOT_API_URL}/api/users/${session.user.id}/birthdays/blacklist-status?guilds=${encodeURIComponent(valid.join(','))}`,
    );
    const data = await res.json();
    return NextResponse.json({ blacklisted: data.blacklisted ?? {} });
  } catch (err) {
    console.error('[blacklist-status GET]', err);
    return NextResponse.json({ blacklisted: {} });
  }
}