import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();

    // Log host read of waitlist to audit_log (Section 5.1 & Section 7)
    db.logAudit('host_read_waitlist', 'host-01', 'profiles', 'waitlist');

    // Get all waitlisted or screened profiles
    const waitlistedProfiles = Array.from(db.profiles.values())
      .filter((p) => p.status === 'waitlisted' || p.status === 'screened')
      .map((p) => {
        const screening = Array.from(db.screenings.values()).find((s) => s.user_id === p.id);
        const userBlocks = db.blocks.filter((b) => b.blocker_id === p.id).map((b) => b.blocked_id);

        return {
          id: p.id,
          displayName: p.display_name,
          status: p.status,
          is18Plus: p.is_18_plus,
          wantsWomenOnly: p.wants_women_only,
          gender: p.gender,
          languages: p.languages,
          interests: p.interests,
          talkVsListen: p.talk_vs_listen || 3,
          plannedVsSpontaneous: p.planned_vs_spontaneous || 3,
          availability: p.availability,
          area: p.area || 'Mysuru',
          screeningBand: screening?.band || 'none',
          hostFollowupDone: screening?.host_followup_done || false,
          blockedUserIds: userBlocks,
          waitingSince: p.created_at,
        };
      });

    return NextResponse.json({
      success: true,
      count: waitlistedProfiles.length,
      waitlist: waitlistedProfiles,
    });
  } catch (error) {
    console.error('Host waitlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
