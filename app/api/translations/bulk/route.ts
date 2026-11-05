import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  bulkUpdateAllTranslations,
  translationErrorResponse,
} from '@/lib/translations';
import type { TranslationBulkAction } from '@/lib/translationTypes';

const BULK_ACTIONS: TranslationBulkAction[] = [
  'approve',
  'unreview',
  'outdated',
  'untranslated',
  'seed',
  'note',
];

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action as TranslationBulkAction;

  if (!BULK_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
  }
  if (!Array.isArray(body?.keys) || body.keys.length === 0) {
    return NextResponse.json({ error: 'No strings selected' }, { status: 400 });
  }

  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  const imageUrl =
    typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : '';
  if (action === 'note' && !note && !imageUrl) {
    return NextResponse.json({ error: 'Write a note first' }, { status: 400 });
  }
  if (action === 'note' && note.length > 2000) {
    return NextResponse.json({ error: 'Note is too long' }, { status: 400 });
  }
  if (imageUrl.length > 2048) {
    return NextResponse.json({ error: 'Image URL is too long' }, { status: 400 });
  }

  const displayLanguage =
    typeof body?.displayLanguage === 'string'
      ? body.displayLanguage.trim()
      : undefined;

  try {
    const result = await bulkUpdateAllTranslations(
      String(session.user.id),
      action,
      body.keys.map((key: unknown) => String(key)),
      note || undefined,
      imageUrl || undefined,
      displayLanguage,
    );
    return NextResponse.json(result);
  } catch (error) {
    return translationErrorResponse(error);
  }
}
