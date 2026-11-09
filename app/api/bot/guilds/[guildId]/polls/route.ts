import { NextRequest, NextResponse } from 'next/server';
import { getBotPolls, createBotPoll } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const data = await getBotPolls(guildId);
    return NextResponse.json(data);
  } catch (error) {
    return botApiError(error, 'Failed to fetch polls');
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    const result = await createBotPoll(
      guildId,
      {
        ...body,
        ownerId: auth.session.user.id,
      },
      auth.session.user.id,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return botApiError(error, 'Failed to create poll');
  }
}
