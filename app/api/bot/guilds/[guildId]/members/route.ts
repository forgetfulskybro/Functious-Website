import { NextRequest, NextResponse } from 'next/server';
import { searchBotGuildMembers } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const query = req.nextUrl.searchParams.get('query') ?? '';

  try {
    const data = await searchBotGuildMembers(guildId, query);
    return NextResponse.json(data);
  } catch (error) {
    return botApiError(error, 'Failed to load members');
  }
}
