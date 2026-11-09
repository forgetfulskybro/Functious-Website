import { NextRequest, NextResponse } from 'next/server';
import { getBotFormSubmissions } from '@/lib/api';
import { botApiError, requireGuildManager } from '@/lib/dashboardRouteAuth';

type Params = { params: Promise<{ guildId: string; formId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { guildId, formId } = await params;
  const auth = await requireGuildManager(guildId);
  if (auth.error) return auth.error;

  try {
    const status = req.nextUrl.searchParams.get('status') ?? 'all';
    return NextResponse.json(
      await getBotFormSubmissions(guildId, formId, status),
    );
  } catch (error) {
    return botApiError(error, 'Failed to fetch form submissions');
  }
}
