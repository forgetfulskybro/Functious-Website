import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { exportTranslations, translationErrorResponse } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const languages = (req.nextUrl.searchParams.get('languages') ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);
  const includePending = ['1', 'true'].includes(
    req.nextUrl.searchParams.get('includePending') ?? '',
  );

  try {
    const { buffer, filename } = await exportTranslations(
      String(session.user.id),
      languages,
      includePending,
    );

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return translationErrorResponse(error);
  }
}
