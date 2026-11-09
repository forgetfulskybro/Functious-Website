import { NextRequest, NextResponse } from 'next/server';
import { createReactionRoles } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    const result = await createReactionRoles(guildId, body, auth.session.user.id);
    return NextResponse.json(result, { status: result?.error ? 400 : 201 });
  } catch (error) {
    return botApiError(error, 'Failed to create reaction roles');
  }
}
