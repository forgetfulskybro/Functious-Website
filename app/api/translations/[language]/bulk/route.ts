import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  bulkUpdateTranslations,
  translationErrorResponse,
} from '@/lib/translations';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ language: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { language } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action !== 'approve' && action !== 'unreview') {
    return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
  }
  if (!Array.isArray(body?.keys) || body.keys.length === 0) {
    return NextResponse.json({ error: 'No strings selected' }, { status: 400 });
  }

  try {
    const result = await bulkUpdateTranslations(
      String(session.user.id),
      language,
      action,
      body.keys.map((key: unknown) => String(key)),
    );
    return NextResponse.json(result);
  } catch (error) {
    return translationErrorResponse(error);
  }
}
