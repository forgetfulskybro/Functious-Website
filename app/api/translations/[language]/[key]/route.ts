import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveTranslation, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ language: string; key: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { language, key } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const value = typeof body?.value === 'string' ? body.value : '';

    const result = await saveTranslation(
      String(session.user.id),
      language,
      key,
      value,
    );

    return NextResponse.json(result);
  } catch (error) {
    return translationErrorResponse(error);
  }
}
