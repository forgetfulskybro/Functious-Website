import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionGuilds } from '@/lib/auth';
import { updateBotTheme } from '@/lib/api';

type Params = { params: Promise<{ guildId: string }> };

function canManageGuild(permissions: string, owner: boolean): boolean {
  if (owner) return true;
  const perms = BigInt(permissions);
  const MANAGE_GUILD = BigInt(0x20);
  const ADMINISTRATOR = BigInt(0x8);
  return (perms & MANAGE_GUILD) === MANAGE_GUILD || (perms & ADMINISTRATOR) === ADMINISTRATOR;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find((g) => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild.permissions, userGuild.owner)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { color?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const color = typeof body.color === 'string' ? body.color.trim() : '';
  if (!color) {
    return NextResponse.json({ error: 'color is required' }, { status: 400 });
  }

  try {
    const result = await updateBotTheme(guildId, color, session.user?.id);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[theme] update failed:', e);
    return NextResponse.json(
      { error: e?.message || 'Failed to update theme' },
      { status: 500 }
    );
  }
}