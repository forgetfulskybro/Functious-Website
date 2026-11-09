import { NextRequest, NextResponse } from 'next/server';
import { runBotCheckup } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await runBotCheckup(guildId));
  } catch (error) {
    return botApiError(error, 'Failed to run health checkup');
  }
}
