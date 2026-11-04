import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  refreshTranslationFiles,
  translationErrorResponse,
} from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const languages = await refreshTranslationFiles(String(session.user.id));
    return NextResponse.json({ ok: true, languages });
  } catch (error) {
    return translationErrorResponse(error);
  }
}
