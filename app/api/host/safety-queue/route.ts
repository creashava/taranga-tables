import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

const severityRank: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * GET /api/host/safety-queue (H6 Safety Queue)
 * Lists open and in-review safety reports.
 * AT12: High-severity reports top the H6 queue.
 */
export async function GET(_req: NextRequest) {
  try {
    const db = getDatabase();

    const reports = Array.from(db.safetyReports.values())
      .filter((r) => r.status !== 'resolved')
      .sort((a, b) => {
        // High severity tops the queue (AT12)
        const rankDiff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
        if (rankDiff !== 0) return rankDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .map((r) => {
        const reporter = r.reporter_id ? db.profiles.get(r.reporter_id) : null;
        const subject = r.subject_user_id ? db.profiles.get(r.subject_user_id) : null;
        const pod = r.pod_id ? db.pods.get(r.pod_id) : null;

        return {
          id: r.id,
          severity: r.severity,
          category: r.category,
          body: r.body,
          status: r.status,
          reporter_name: reporter?.display_name || 'Anonymous',
          subject_name: subject?.display_name || null,
          pod_name: pod?.name || null,
          created_at: r.created_at,
        };
      });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('GET /api/host/safety-queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
