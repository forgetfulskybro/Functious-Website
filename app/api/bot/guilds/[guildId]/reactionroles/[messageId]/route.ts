import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionGuilds, canManageGuild } from '@/lib/auth';
import { updateReactionRoles, fetchReactionRoles } from '@/lib/api';

type Params = { params: Promise<{ guildId: string; messageId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId, messageId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find((g) => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild, String(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await fetchReactionRoles(guildId, messageId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch giveaways' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { guildId, messageId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find((g) => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild, String(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  try {
    const result = await updateReactionRoles(guildId, messageId, body, session.user.id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to update reaction roles exclusivity' },
      { status: 500 }
    );
  }
}