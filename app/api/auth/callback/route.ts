import { NextRequest, NextResponse } from 'next/server';
import { safeNextPath } from '@/lib/auth';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${BASE_URL}/auth-error?reason=denied`);
  }

  const next = safeNextPath(searchParams.get('state'));
  const target = new URL(`${BASE_URL}/auth-callback`);
  target.searchParams.set('code', code);
  if (next) target.searchParams.set('next', next);

  return NextResponse.redirect(target);
}
