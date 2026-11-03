import { NextResponse } from 'next/server';
import { getTranslationLanguages, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const languages = await getTranslationLanguages();
    return NextResponse.json({ languages });
  } catch (error) {
    return translationErrorResponse(error);
  }
}
