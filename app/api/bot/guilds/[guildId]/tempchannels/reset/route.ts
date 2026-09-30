import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionGuilds, canManageGuild } from '@/lib/auth';
import { resetTempChannels } from '@/lib/api';

type Params = { params: Promise<{ guildId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
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

  try {
    const result = await resetTempChannels(guildId, session.user.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to reset temp channels' },
      { status: 500 }
    );
  }
}