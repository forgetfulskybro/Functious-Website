import { NextRequest, NextResponse } from 'next/server';
import { deleteBotForm, getBotForm, updateBotForm } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string; formId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId, formId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(await getBotForm(guildId, formId));
  } catch (error) {
    return botApiError(error, 'Failed to fetch form');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { guildId, formId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    return NextResponse.json(
      await updateBotForm(guildId, formId, body, auth.session?.user.id),
    );
  } catch (error) {
    return botApiError(error, 'Failed to update form');
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { guildId, formId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(
      await deleteBotForm(guildId, formId, auth.session?.user.id),
    );
  } catch (error) {
    return botApiError(error, 'Failed to delete form');
  }
}
