import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTranslators, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const translators = await getTranslators(String(session.user.id));
    return NextResponse.json({ translators });
  } catch (error) {
    return translationErrorResponse(error);
  }
}
