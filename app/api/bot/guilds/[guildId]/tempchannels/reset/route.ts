import { NextRequest, NextResponse } from 'next/server';
import { resetTempChannels } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const result = await resetTempChannels(guildId, auth.session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return botApiError(error, 'Failed to reset temp channels');
  }
}
