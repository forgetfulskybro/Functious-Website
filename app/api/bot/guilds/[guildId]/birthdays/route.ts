import { NextRequest, NextResponse } from 'next/server';
import { getBotGuildBirthdays, forceBotBirthday } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const data = await getBotGuildBirthdays(guildId);
    return NextResponse.json(data);
  } catch (error) {
    return botApiError(error, 'Failed to load birthdays');
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    if (!body.userId || typeof body.userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const result = await forceBotBirthday(guildId, body.userId, auth.session.user.id);
    return NextResponse.json(
      result,
      result?.error ? { status: 400 } : { status: 200 },
    );
  } catch (error) {
    return botApiError(error, 'Failed to announce birthday');
  }
}
