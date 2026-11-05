import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  bulkDeleteTranslatorContributions,
  translationErrorResponse,
} from '@/lib/translations';
import type { TranslatorBulkDeleteAction } from '@/lib/translationTypes';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ userId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { userId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: unknown;
    items?: unknown;
  };
  const action = body.action;

  if (action !== 'notes' && action !== 'translations') {
    return NextResponse.json(
      { error: 'Invalid bulk delete action' },
      { status: 400 },
    );
  }

  const items = (Array.isArray(body.items) ? body.items : [])
    .map((item) => {
      const record = item as { language?: unknown; key?: unknown };
      return {
        language:
          typeof record?.language === 'string' ? record.language : '',
        key: typeof record?.key === 'string' ? record.key : '',
      };
    })
    .filter((item) => item.language && item.key);

  try {
    const result = await bulkDeleteTranslatorContributions(
      String(session.user.id),
      userId,
      action as TranslatorBulkDeleteAction,
      items,
    );
    return NextResponse.json(result);
  } catch (error) {
    return translationErrorResponse(error);
  }
}
