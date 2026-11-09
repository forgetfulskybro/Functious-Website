import { NextRequest, NextResponse } from 'next/server';
import { createBotForm, getBotForms } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await getBotForms(guildId));
  } catch (error) {
    return botApiError(error, 'Failed to fetch forms');
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    const result = await createBotForm(guildId, body, auth.session?.user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return botApiError(error, 'Failed to create form');
  }
}
