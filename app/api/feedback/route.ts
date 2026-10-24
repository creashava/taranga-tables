import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';

const feedbackSchema = z.object({
  userId: z.string().min(1),
  meetupId: z.string().min(1),
  feltSafe: z.number().int().min(1).max(5),
  feltIncluded: z.number().int().min(1).max(5),
  wouldReturn: z.boolean(),
  freeText: z.string().max(1000).optional(),
  shareWithHost: z.boolean().default(false),
});

/**
 * POST /api/feedback
 * Submit post-table feedback (2-minute check-in).
 * Anonymous to peers. Hosts never see free_text attributed to a user unless share_with_host is true (SPEC 5.1).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, meetupId, feltSafe, feltIncluded, wouldReturn, freeText, shareWithHost } = parsed.data;
    const db = getDatabase();

    const meetup = db.meetups.get(meetupId);
    if (!meetup) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }

    const feedbackId = `fb-${meetupId}-${userId}`;
    db.feedback.set(feedbackId, {
      id: feedbackId,
      meetup_id: meetupId,
      user_id: userId,
      felt_safe: feltSafe,
      felt_included: feltIncluded,
      would_return: wouldReturn,
      free_text: freeText,
      share_with_host: shareWithHost,
      created_at: new Date().toISOString(),
    });

    db.logEvent('feedback_submitted', userId, meetup.pod_id, {
      meetup_id: meetupId,
      felt_safe: feltSafe,
      felt_included: feltIncluded,
      would_return: wouldReturn,
      share_with_host: shareWithHost,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback. It helps us care for the community.',
    });
  } catch (error) {
    console.error('POST /api/feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
