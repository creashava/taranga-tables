import { NextRequest, NextResponse } from 'next/server';
import { checkinSubmissionSchema } from '@/lib/validations/onboarding';
import { getDatabase } from '@/lib/db';
import checkinConfig from '@/config/checkin.json';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkinSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, answers } = parsed.data;

    // AT3: Compute band server-side and DISCARD raw answers immediately
    let totalScore = 0;
    for (const val of Object.values(answers)) {
      totalScore += Number(val) || 0;
    }

    let triageBand: 'none' | 'mild' | 'elevated' = 'none';
    for (const bandDef of checkinConfig.scoring.bands) {
      if (totalScore >= bandDef.min_score && totalScore <= bandDef.max_score) {
        triageBand = bandDef.band as 'none' | 'mild' | 'elevated';
        break;
      }
    }

    const isElevated = triageBand === 'elevated';
    const db = getDatabase();

    // Store ONLY the band in screenings table (AT3)
    const screeningId = `s-${userId}-${Date.now()}`;
    db.screenings.set(screeningId, {
      id: screeningId,
      user_id: userId,
      instrument_version: checkinConfig.version,
      band: triageBand,
      helpline_shown: isElevated,
      host_followup_done: false,
      created_at: new Date().toISOString(),
    });

    // Update member profile status
    const profile = db.profiles.get(userId);
    if (profile) {
      // If elevated, held at 'screened' until host follow-up (AT4); otherwise waitlisted
      profile.status = isElevated ? 'screened' : 'waitlisted';
      db.profiles.set(userId, profile);
    }

    // Write name-only row to event_log with band only (props must NEVER contain raw answers)
    db.logEvent('checkin_completed', userId, undefined, { band: triageBand });

    return NextResponse.json({
      success: true,
      band: triageBand,
      helplineShown: isElevated,
      helplineMessage: isElevated ? checkinConfig.helpline_resources.message : null,
      resources: isElevated ? checkinConfig.helpline_resources.numbers : [],
      nextStatus: isElevated ? 'screened' : 'waitlisted',
    });
  } catch (error) {
    console.error('Checkin API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
