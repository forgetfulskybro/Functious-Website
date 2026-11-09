import { NextRequest, NextResponse } from 'next/server';
import { setupTempChannels } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const result = await setupTempChannels(guildId, body, auth.session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return botApiError(error, 'Failed to setup temp channels');
  }
}
