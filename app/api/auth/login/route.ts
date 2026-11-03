import { NextRequest, NextResponse } from 'next/server';
import { getOAuthUrl, safeNextPath } from '@/lib/auth';

function isAuthPath(path: string): boolean {
  return (
    path === '/login' ||
    path.startsWith('/auth') ||
    path.startsWith('/api/auth')
  );
}

function requestedNext(req: NextRequest): string | null {
  const explicit = safeNextPath(req.nextUrl.searchParams.get('next'));
  if (explicit) return isAuthPath(explicit) ? null : explicit;

  const referer = req.headers.get('referer');
  if (!referer) return null;

  try {
    const url = new URL(referer);
    if (url.origin !== req.nextUrl.origin) return null;

    const path = `${url.pathname}${url.search}`;
    if (isAuthPath(path)) return null;

    return safeNextPath(path);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const next = requestedNext(req);
  const url = getOAuthUrl(next ?? undefined);
  return NextResponse.redirect(url);
}
