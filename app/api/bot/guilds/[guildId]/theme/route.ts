import { NextRequest, NextResponse } from 'next/server';
import { updateBotTheme } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  let body: { color?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const color = typeof body.color === 'string' ? body.color.trim() : '';
  if (!color) {
    return NextResponse.json({ error: 'color is required' }, { status: 400 });
  }

  try {
    const result = await updateBotTheme(guildId, color, auth.session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[theme] update failed:', error);
    return botApiError(error, 'Failed to update theme');
  }
}
