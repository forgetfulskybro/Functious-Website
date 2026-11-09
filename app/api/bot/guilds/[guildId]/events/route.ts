import { NextRequest, NextResponse } from 'next/server';
import { createBotEvent, getBotEvents } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const filter = req.nextUrl.searchParams.get('filter') ?? 'upcoming';
    return NextResponse.json(await getBotEvents(guildId, filter));
  } catch (error) {
    return botApiError(error, 'Failed to fetch events');
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    const result = await createBotEvent(guildId, body, auth.session?.user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return botApiError(error, 'Failed to create event');
  }
}
