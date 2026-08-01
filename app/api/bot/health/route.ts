import { NextResponse } from 'next/server';
import { getBotHealth } from '@/lib/api';

export async function GET() {
  const health = await getBotHealth();
  if (!health) {
    return NextResponse.json({ ok: false, online: false }, { status: 503 });
  }
  return NextResponse.json(health);
}
