import { NextRequest, NextResponse } from 'next/server';
import { addBirthdayBlacklist, removeBirthdayBlacklist } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

const SNOWFLAKE_RE = /^\d{17,20}$/;

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.userId ?? '';
    if (!SNOWFLAKE_RE.test(userId)) {
      return NextResponse.json({ error: 'A valid Fluxer user ID is required' }, { status: 400 });
    }

    const result = await addBirthdayBlacklist(guildId, userId, auth.session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return botApiError(error, 'Failed to update blacklist');
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const userId = req.nextUrl.searchParams.get('userId') ?? '';
    if (!SNOWFLAKE_RE.test(userId)) {
      return NextResponse.json({ error: 'A valid Fluxer user ID is required' }, { status: 400 });
    }

    const result = await removeBirthdayBlacklist(guildId, userId, auth.session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return botApiError(error, 'Failed to update blacklist');
  }
}
