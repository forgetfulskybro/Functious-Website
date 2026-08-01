import { NextRequest, NextResponse } from 'next/server';
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
    throw new Error(`Bot API returned non-JSON response (status ${res.status})`);
  }
  return res;
}

type Params = { params: Promise<{ reminderId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { reminderId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  try {
    const body = await req.json();
    const res = await safeBotFetch(`${BOT_API_URL}/api/users/${session.user.id}/reminders/${reminderId}`, {
      method: 'PATCH',
      headers: botHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error('[reminders PATCH]', err);
    return NextResponse.json({ error: 'Bot API unreachable' }, { status: 503 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { reminderId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  try {
    const res = await safeBotFetch(`${BOT_API_URL}/api/users/${session.user.id}/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: botHeaders(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error('[reminders DELETE]', err);
    return NextResponse.json({ error: 'Bot API unreachable' }, { status: 503 });
  }
}
