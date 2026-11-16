import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/dashboardRouteAuth';

const BOT_API_URL = process.env.BOT_API_URL ?? 'http://localhost:4000';
const BOT_API_KEY = process.env.BOT_API_KEY ?? '';
const CONFIRM_PHRASE = 'DELETE EVERYTHING';
const SELECTED_CONFIRM_PHRASE = 'DELETE SELECTED';
const MAX_SELECTED_ITEMS = 100;
const SELECTED_TYPES = new Set([
  'poll',
  'giveaway',
  'event',
  'rsvp',
  'form',
  'submission',
  'translation',
  'guild',
]);

type SelectedItem = {
  type: string;
  id?: string;
  guildId?: string;
};

function botHeaders() {
  return { 'Content-Type': 'application/json', 'x-api-key': BOT_API_KEY };
}

async function botFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Bot API returned a non-JSON response (status ${res.status}).`);
  }
  return res;
}

function forwardJson(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function parseSelectedItems(value: unknown): SelectedItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_SELECTED_ITEMS) {
    return null;
  }

  const items: SelectedItem[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null;

    const item = raw as { type?: unknown; id?: unknown; guildId?: unknown };
    const type = typeof item.type === 'string' ? item.type : '';
    if (!SELECTED_TYPES.has(type)) return null;

    if (type === 'guild') {
      const guildId = typeof item.guildId === 'string' ? item.guildId : '';
      if (!/^\d{17,20}$/.test(guildId)) return null;
      items.push({ type, guildId });
    } else {
      const id = typeof item.id === 'string' ? item.id : '';
      if (!/^[a-f0-9]{24}$/i.test(id)) return null;
      items.push({ type, id });
    }
  }

  return items;
}

export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  try {
    const res = await botFetch(
      `${BOT_API_URL}/api/users/${encodeURIComponent(auth.session.user.id)}/data`,
      { headers: botHeaders(), cache: 'no-store' },
    );
    const data = await res.json().catch(() => ({}));
    return forwardJson(data, res.status);
  } catch (err) {
    console.error('[user-data GET]', err);
    return NextResponse.json({ error: 'Bot API unreachable' }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = body as {
    confirm?: unknown;
    confirmation?: unknown;
    confirmUserId?: unknown;
    items?: unknown;
  };
  const confirmation =
    typeof payload.confirmation === 'string' ? payload.confirmation.trim() : '';
  const confirmUserId =
    typeof payload.confirmUserId === 'string' ? payload.confirmUserId.trim() : '';
  const isEverything = confirmation === CONFIRM_PHRASE;
  const isSelected = confirmation === SELECTED_CONFIRM_PHRASE;

  if (
    payload.confirm !== true ||
    (!isEverything && !isSelected) ||
    confirmUserId !== String(auth.session.user.id)
  ) {
    return NextResponse.json(
      { error: 'Deletion confirmation did not match' },
      { status: 400 },
    );
  }

  let selectedItems: SelectedItem[] | null = null;
  if (isSelected) {
    selectedItems = parseSelectedItems(payload.items);
    if (!selectedItems) {
      return NextResponse.json(
        { error: `Select between 1 and ${MAX_SELECTED_ITEMS} valid items` },
        { status: 400 },
      );
    }
  }

  try {
    const res = await botFetch(
      `${BOT_API_URL}/api/users/${encodeURIComponent(auth.session.user.id)}/data`,
      {
        method: 'DELETE',
        headers: botHeaders(),
        body: JSON.stringify({
          confirm: true,
          confirmation,
          confirmUserId,
          ...(selectedItems ? { items: selectedItems } : {}),
        }),
        cache: 'no-store',
      },
    );
    const data = await res.json().catch(() => ({}));
    return forwardJson(data, res.status);
  } catch (err) {
    console.error('[user-data DELETE]', err);
    return NextResponse.json({ error: 'Bot API unreachable' }, { status: 503 });
  }
}
