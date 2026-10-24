import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { calculatePilotMetrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/host/metrics
 * Returns pilot analytics for H8 dashboard (Section 10.2).
 */
export async function GET(_req: NextRequest) {
  try {
    const db = getDatabase();
    const metrics = calculatePilotMetrics(db);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('GET /api/host/metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
