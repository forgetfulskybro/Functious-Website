import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getTranslatorContributions,
  translationErrorResponse,
} from '@/lib/translations';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { userId } = await params;

  try {
    const contributions = await getTranslatorContributions(
      String(session.user.id),
      userId,
    );
    return NextResponse.json({ contributions });
  } catch (error) {
    return translationErrorResponse(error);
  }
}
