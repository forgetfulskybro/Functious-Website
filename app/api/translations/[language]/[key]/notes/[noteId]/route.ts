import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteTranslationNote, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ language: string; key: string; noteId: string }>;
};

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { language, key, noteId } = await params;

  try {
    const result = await deleteTranslationNote(
      String(session.user.id),
      language,
      key,
      noteId,
    );
    return NextResponse.json(result);
  } catch (error) {
    return translationErrorResponse(error);
  }
}
