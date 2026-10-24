import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';

const followupSchema = z.object({
  notes: z.string().min(1),
  approvedForMatching: z.boolean().default(true),
});

/**
 * POST /api/host/screenings/[id]/followup
 * Records that the host phoned an elevated-band person (AT4).
 * Sets host_followup_done = true and logs audit record.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const screeningId = params.id;
    const body = await req.json();
    const parsed = followupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { notes } = parsed.data;
    const db = getDatabase();

    // Find screening by id or user_id
    const screening = Array.from(db.screenings.values()).find(
      (s) => s.id === screeningId || s.user_id === screeningId
    );

    if (!screening) {
      return NextResponse.json({ error: 'Screening not found' }, { status: 404 });
    }

    screening.host_followup_done = true;
    db.screenings.set(screening.user_id, screening);

    db.logAudit('host_screening_followup', 'host-01', 'screening', screening.id);
    db.logEvent('screening_followup_completed', screening.user_id, undefined, {
      screening_id: screening.id,
      notes_length: notes.length,
    });

    console.log(
      `[HOST FOLLOWUP - AT4] Follow-up recorded for user ${screening.user_id}. Member is now eligible for matching.`
    );

    return NextResponse.json({
      success: true,
      message: 'Follow-up recorded. Member may now be placed in matching suggestions.',
    });
  } catch (error) {
    console.error('POST /api/host/screenings/[id]/followup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
