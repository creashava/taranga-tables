import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';
import { getPaymentAdapter } from '@/lib/adapters/payments';

const rsvpSchema = z.object({
  userId: z.string().min(1),
  meetupId: z.string().min(1),
  response: z.enum(['yes', 'no', 'maybe']),
});

/**
 * POST /api/rsvp
 * Member RSVPs for a meetup. If the pod is on the deposit arm and response is 'yes',
 * calls PaymentProvider.createHold. Refund terms are shown before payment is initiated
 * (AT11, R12 — never pre-ticked, refund terms shown before payment).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, meetupId, response } = parsed.data;
    const db = getDatabase();

    // Verify meetup exists
    const meetup = db.meetups.get(meetupId);
    if (!meetup) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }

    // Verify member is in this pod
    const membership = db.podMembers.find(
      (pm) => pm.user_id === userId && pm.pod_id === meetup.pod_id && !pm.left_at
    );
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 });
    }

    const pod = db.pods.get(meetup.pod_id);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    let depositStatus: 'none' | 'pending' | 'held' | 'refunded' | 'forfeited' = 'none';
    let paymentRef: string | undefined;
    let holdAmountInr: number | undefined;

    // AT11: deposit arm + yes response → create hold
    if (pod.arm === 'deposit' && response === 'yes' && pod.deposit_inr > 0) {
      const paymentAdapter = getPaymentAdapter();
      const holdResult = await paymentAdapter.createHold(userId, pod.id, pod.deposit_inr);
      if (!holdResult.success) {
        return NextResponse.json(
          { error: 'Could not create deposit hold. Please try again.' },
          { status: 502 }
        );
      }
      depositStatus = 'held';
      paymentRef = holdResult.ref;
      holdAmountInr = holdResult.amountInr;
    }

    // Upsert RSVP
    const rsvpKey = `${meetupId}:${userId}`;
    db.rsvps.set(rsvpKey, {
      meetup_id: meetupId,
      user_id: userId,
      response,
      deposit: depositStatus,
      payment_ref: paymentRef,
      responded_at: new Date().toISOString(),
    });

    db.logEvent(`rsvp_${response}`, userId, pod.id, {
      meetup_id: meetupId,
      seq: meetup.seq,
      deposit: depositStatus,
    });

    // AT21: Check if fewer than 4 confirmed 'yes' RSVPs within 24h of meetup
    const meetupTime = new Date(meetup.starts_at);
    const now = new Date();
    const hoursUntilMeetup = (meetupTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    let lowRsvpTask: string | null = null;

    if (hoursUntilMeetup <= 24 && hoursUntilMeetup > 0) {
      const allRsvps = Array.from(db.rsvps.values()).filter(
        (r) => r.meetup_id === meetupId && r.response === 'yes'
      );
      if (allRsvps.length < 4) {
        lowRsvpTask = `Low RSVPs for Table ${meetup.seq} (${allRsvps.length}/4 minimum confirmed). Consider rescheduling or merging.`;
        db.logAudit('low_rsvp_host_task', undefined, 'meetup', meetupId);
      }
    }

    return NextResponse.json({
      success: true,
      response,
      deposit_status: depositStatus,
      payment_ref: paymentRef ?? null,
      hold_amount_inr: holdAmountInr ?? null,
      low_rsvp_task: lowRsvpTask,
    });
  } catch (error) {
    console.error('POST /api/rsvp error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
