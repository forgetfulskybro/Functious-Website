import { NextResponse } from 'next/server';
import { getTranslationLanguage, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ language: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { language } = await params;

  try {
    const data = await getTranslationLanguage(language);
    return NextResponse.json(data);
  } catch (error) {
    return translationErrorResponse(error);
  }
}
