import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { addTranslationNote, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ language: string; key: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { language, key } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text : '';

    const result = await addTranslationNote(
      String(session.user.id),
      language,
      key,
      text,
    );

    return NextResponse.json(result);
  } catch (error) {
    return translationErrorResponse(error);
  }
}
