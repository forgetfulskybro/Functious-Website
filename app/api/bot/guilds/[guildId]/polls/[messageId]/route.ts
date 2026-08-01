import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionGuilds } from '@/lib/auth';
import { deleteBotPoll } from '@/lib/api';

type Params = { params: Promise<{ guildId: string; messageId: string }> };

function canManageGuild(permissions: string, owner: boolean): boolean {
  if (owner) return true;
  const perms = BigInt(permissions);
  return (perms & 0x20n) === 0x20n || (perms & 0x8n) === 0x8n;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { guildId, messageId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find(g => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild.permissions, userGuild.owner)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await deleteBotPoll(guildId, messageId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete poll' }, { status: 500 });
  }
}
