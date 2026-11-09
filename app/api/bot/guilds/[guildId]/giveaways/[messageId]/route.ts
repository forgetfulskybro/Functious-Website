import { NextRequest, NextResponse } from 'next/server';
import { deleteBotGiveaway } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string; messageId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { guildId, messageId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const result = await deleteBotGiveaway(guildId, messageId, auth.session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return botApiError(error, 'Failed to delete giveaway');
  }
}
