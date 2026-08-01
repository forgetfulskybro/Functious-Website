import { NextResponse } from 'next/server';
import { getBotHistoricalStats } from '@/lib/api';

export async function GET() {
  const historicalStats = await getBotHistoricalStats();
  if (!historicalStats) {
    return NextResponse.json({ error: 'Failed to fetch historical bot stats' }, { status: 503 });
  }
  return NextResponse.json(historicalStats);
}