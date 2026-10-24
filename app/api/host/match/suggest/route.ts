import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { runMatchingAlgorithm, MatchCandidate } from '@/lib/matching';

export async function POST(req: NextRequest) {
  try {
    const db = getDatabase();

    db.logAudit('host_run_match_suggest', 'host-01', 'matching', 'all');

    // Retrieve candidates from database who are waitlisted
    const candidates: MatchCandidate[] = Array.from(db.profiles.values())
      .filter((p) => p.status === 'waitlisted')
      .map((p) => {
        const screening = Array.from(db.screenings.values()).find((s) => s.user_id === p.id);
        const userBlocks = db.blocks.filter((b) => b.blocker_id === p.id).map((b) => b.blocked_id);

        return {
          id: p.id,
          displayName: p.display_name,
          is18Plus: p.is_18_plus,
          status: p.status,
          screeningBand: screening?.band || 'none',
          hostFollowupDone: screening?.host_followup_done || false,
          wantsWomenOnly: p.wants_women_only,
          gender: p.gender,
          languages: p.languages,
          interests: p.interests,
          talkVsListen: p.talk_vs_listen || 3,
          plannedVsSpontaneous: p.planned_vs_spontaneous || 3,
          availability: p.availability,
          area: p.area || 'Mysuru',
          blockedUserIds: userBlocks,
          waitingSince: p.created_at,
        };
      });

    const result = runMatchingAlgorithm(candidates);

    return NextResponse.json({
      success: true,
      suggestions: result.suggestedPods,
      unplacedCount: result.unplacedCandidates.length,
      unplacedCandidates: result.unplacedCandidates.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        area: c.area,
        wantsWomenOnly: c.wantsWomenOnly,
      })),
    });
  } catch (error) {
    console.error('Match suggest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
