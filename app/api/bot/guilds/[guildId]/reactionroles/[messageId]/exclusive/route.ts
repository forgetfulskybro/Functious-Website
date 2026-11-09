import { NextRequest, NextResponse } from 'next/server';
import { exclusiveReactionRoles } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string; messageId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { guildId, messageId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const result = await exclusiveReactionRoles(
      guildId,
      messageId,
      auth.session.user.id,
    );
    return NextResponse.json(result, { status: result?.error ? 400 : 200 });
  } catch (error) {
    return botApiError(error, 'Failed to update reaction roles exclusivity');
  }
}
