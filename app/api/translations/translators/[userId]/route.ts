import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  removeTranslator,
  updateTranslator,
  translationErrorResponse,
} from '@/lib/translations';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ userId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { userId } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const updates: {
      languages?: string[];
      proofreader?: boolean;
      developer?: boolean;
    } = {};

    if (Array.isArray(body?.languages)) {
      updates.languages = body.languages.map((code: unknown) => String(code));
    }
    if (typeof body?.proofreader === 'boolean') updates.proofreader = body.proofreader;
    if (typeof body?.developer === 'boolean') updates.developer = body.developer;

    const translator = await updateTranslator(
      String(session.user.id),
      userId,
      updates,
    );

    return NextResponse.json({ translator });
  } catch (error) {
    return translationErrorResponse(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { userId } = await params;

  try {
    await removeTranslator(String(session.user.id), userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return translationErrorResponse(error);
  }
}
