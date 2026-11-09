import { NextRequest, NextResponse } from 'next/server';
import { updateReactionRoles, fetchReactionRoles } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string; messageId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId, messageId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const data = await fetchReactionRoles(guildId, messageId);
    return NextResponse.json(data);
  } catch (error) {
    return botApiError(error, 'Failed to fetch reaction roles');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { guildId, messageId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    const result = await updateReactionRoles(
      guildId,
      messageId,
      body,
      auth.session.user.id,
    );
    return NextResponse.json(result, { status: result?.error ? 400 : 200 });
  } catch (error) {
    return botApiError(error, 'Failed to update reaction roles');
  }
}
