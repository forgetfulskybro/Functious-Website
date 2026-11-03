import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { requestTranslationLanguages, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const languages = Array.isArray(body?.languages)
      ? body.languages.map((code: unknown) => String(code))
      : [];

    const permissions = await requestTranslationLanguages(
      String(session.user.id),
      languages,
    );

    return NextResponse.json({ permissions });
  } catch (error) {
    return translationErrorResponse(error);
  }
}
