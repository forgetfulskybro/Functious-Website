import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTranslationPermissions, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    const permissions = await getTranslationPermissions(String(session.user.id));
    return NextResponse.json({ permissions });
  } catch (error) {
    return translationErrorResponse(error);
  }
}
