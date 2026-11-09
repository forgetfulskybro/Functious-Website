import { NextRequest, NextResponse } from 'next/server';
import { deleteBotFormSubmission, updateBotFormSubmission } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = {
  params: Promise<{ guildId: string; formId: string; submissionId: string }>;
};

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { guildId, formId, submissionId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    return NextResponse.json(
      await deleteBotFormSubmission(
        guildId,
        formId,
        submissionId,
        auth.session?.user.id,
      ),
    );
  } catch (error) {
    return botApiError(error, 'Failed to delete form submission');
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { guildId, formId, submissionId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));

  try {
    return NextResponse.json(
      await updateBotFormSubmission(
        guildId,
        formId,
        submissionId,
        body,
        auth.session?.user.id,
      ),
    );
  } catch (error) {
    return botApiError(error, 'Failed to review form submission');
  }
}
