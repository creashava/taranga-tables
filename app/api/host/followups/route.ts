import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/host/followups (H7 Check-in Follow-ups)
 * Returns:
 * 1. Elevated screening band members awaiting host phone follow-up (AT4).
 * 2. Members who recently withdrew from their pod requiring kind personal check-in (AT15).
 */
export async function GET(_req: NextRequest) {
  try {
    const db = getDatabase();

    // 1. Elevated screenings
    const pendingScreenings = Array.from(db.screenings.values())
      .filter((s) => s.band === 'elevated' && !s.host_followup_done)
      .map((s) => {
        const profile = db.profiles.get(s.user_id);
        return {
          id: s.id,
          userId: s.user_id,
          displayName: profile?.display_name || 'Applicant',
          area: profile?.area || 'Mysuru',
          band: s.band,
          createdAt: s.created_at,
          kind: 'elevated_screening' as const,
        };
      });

    // 2. Pod withdrawals
    const withdrawals = db.podMembers
      .filter((pm) => !!pm.left_at)
      .map((pm) => {
        const profile = db.profiles.get(pm.user_id);
        const pod = db.pods.get(pm.pod_id);
        return {
          id: `w-${pm.user_id}-${pm.pod_id}`,
          userId: pm.user_id,
          displayName: profile?.display_name || 'Member',
          podName: pod?.name || pm.pod_id,
          leftAt: pm.left_at!,
          kind: 'pod_withdrawal' as const,
        };
      });

    return NextResponse.json({
      pendingScreenings,
      withdrawals,
    });
  } catch (error) {
    console.error('GET /api/host/followups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
