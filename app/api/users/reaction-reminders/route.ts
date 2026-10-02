import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BOT_API_URL = process.env.BOT_API_URL ?? 'http://localhost:4000';
const BOT_API_KEY = process.env.BOT_API_KEY ?? '';

function botHeaders() {
  return { 'Content-Type': 'application/json', 'x-api-key': BOT_API_KEY };
}

async function safeBotFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Bot API returned non-JSON response (status ${res.status}).`);
  }
  return res;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  try {
    const res = await safeBotFetch(
      `${BOT_API_URL}/api/users/${session.user.id}/reaction-reminders`,
      { headers: botHeaders(), cache: 'no-store' }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[reaction-reminders GET]', err);
    return NextResponse.json({ reactionReminders: [] });
  }
}
