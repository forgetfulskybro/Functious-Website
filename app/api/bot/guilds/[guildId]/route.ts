import { NextRequest, NextResponse } from 'next/server';
import { getBotGuild, updateBotGuild } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const guild = await getBotGuild(guildId);
    if (!guild) {
      return NextResponse.json({ error: 'Bot is not in this community' }, { status: 404 });
    }

    return NextResponse.json(guild);
  } catch (error) {
    return botApiError(error, 'Failed to load settings');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    const result = await updateBotGuild(guildId, body, auth.session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return botApiError(error, 'Failed to update settings');
  }
}
