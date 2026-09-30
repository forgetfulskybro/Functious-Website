import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionGuilds, canManageGuild } from '@/lib/auth';
import { getBotGuild, updateBotGuild } from '@/lib/api';

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find(g => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild, String(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const guild = await getBotGuild(guildId);
  if (!guild) {
    return NextResponse.json({ error: 'Bot is not in this community' }, { status: 404 });
  }

  return NextResponse.json(guild);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find(g => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild, String(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  try {
    const result = await updateBotGuild(guildId, body, session.user.id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
