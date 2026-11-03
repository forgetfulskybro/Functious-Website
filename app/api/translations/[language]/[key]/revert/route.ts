import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { revertTranslation, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ language: string; key: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { language, key } = await params;

  try {
    const result = await revertTranslation(
      String(session.user.id),
      language,
      key,
    );
    return NextResponse.json(result);
  } catch (error) {
    return translationErrorResponse(error);
  }
}
