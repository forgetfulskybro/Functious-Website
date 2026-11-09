import { NextRequest, NextResponse } from 'next/server';
import { publishBotForm } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string; formId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId, formId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    return NextResponse.json(
      await publishBotForm(guildId, formId, body, auth.session?.user.id),
    );
  } catch (error) {
    return botApiError(error, 'Failed to publish form panel');
  }
}
