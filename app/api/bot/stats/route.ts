import { NextResponse } from 'next/server';
import { getBotStats } from '@/lib/api';

export async function GET() {
  const stats = await getBotStats();
  if (!stats) {
    return NextResponse.json({ error: 'Bot unreachable' }, { status: 503 });
  }
  return NextResponse.json(stats);
}
