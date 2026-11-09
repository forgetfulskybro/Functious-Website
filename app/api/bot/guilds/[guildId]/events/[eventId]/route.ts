import { NextRequest, NextResponse } from 'next/server';
import { deleteBotEvent, getBotEvent, updateBotEvent } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string; eventId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId, eventId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await getBotEvent(guildId, eventId));
  } catch (error) {
    return botApiError(error, 'Failed to fetch event');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { guildId, eventId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    return NextResponse.json(
      await updateBotEvent(guildId, eventId, body, auth.session?.user.id),
    );
  } catch (error) {
    return botApiError(error, 'Failed to update event');
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { guildId, eventId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(
      await deleteBotEvent(guildId, eventId, auth.session?.user.id),
    );
  } catch (error) {
    return botApiError(error, 'Failed to delete event');
  }
}
