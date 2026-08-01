import { NextResponse } from 'next/server';
import { getBotHistoricalHealth } from '@/lib/api';

export async function GET() {
  const historicalHealth = await getBotHistoricalHealth();
  if (!historicalHealth) {
    return NextResponse.json({ error: 'Failed to fetch historical bot health' }, { status: 503 });
  }
  return NextResponse.json(historicalHealth);
}