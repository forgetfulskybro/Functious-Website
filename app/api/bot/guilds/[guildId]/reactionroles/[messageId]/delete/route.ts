import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionGuilds, canManageGuild } from '@/lib/auth';
import { deleteReactionRoles } from '@/lib/api';

type Params = { params: Promise<{ guildId: string; messageId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { guildId, messageId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find((g) => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild, String(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await deleteReactionRoles(guildId, messageId, session.user.id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to update reaction roles exclusivity' },
      { status: 500 }
    );
  }
}