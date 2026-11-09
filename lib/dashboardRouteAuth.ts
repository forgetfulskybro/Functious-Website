import { NextResponse } from 'next/server';
import { getSession, getSessionGuilds, canManageGuild } from '@/lib/auth';
import type { Session } from '@/lib/types';

export type RouteAuth =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

export async function requireSession(): Promise<RouteAuth> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }),
    };
  }

  return { session, error: null };
}

export async function requireGuildManager(guildId: string): Promise<RouteAuth> {
  const auth = await requireSession();
  if (auth.error) return auth;

  const guilds = await getSessionGuilds(auth.session.accessToken);
  const userGuild = guilds.find((guild) => guild.id === guildId);
  if (!userGuild || !canManageGuild(userGuild, String(auth.session.user.id))) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return auth;
}

export function botApiError(error: unknown, fallback: string) {
  const status =
    typeof (error as { status?: unknown })?.status === 'number'
      ? (error as { status: number }).status
      : 500;
  const message =
    error instanceof Error && error.message ? error.message : fallback;

  return NextResponse.json({ error: message }, { status });
}
