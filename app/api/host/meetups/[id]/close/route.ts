import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';
import { getPaymentAdapter } from '@/lib/adapters/payments';

const closeSchema = z.object({
  noShowPolicy: z.enum(['forfeit', 'refund', 'none']).default('forfeit'),
});

/**
 * POST /api/host/meetups/[id]/close
 * Host closes (marks done) a meetup.
 * Applies no-show deposit policy: forfeit or refund per host choice.
 * AT21: If fewer than 4 attended, creates a host task (neutral message, no guilt).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetupId = params.id;
    const body = await req.json();
    const parsed = closeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { noShowPolicy } = parsed.data;
    const db = getDatabase();
    const paymentAdapter = getPaymentAdapter();

    const meetup = db.meetups.get(meetupId);
    if (!meetup) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }
    if (meetup.status === 'done') {
      return NextResponse.json({ error: 'Meetup already closed' }, { status: 409 });
    }

    const pod = db.pods.get(meetup.pod_id);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    // Apply no-show policy for deposit arm
    const noShowActions: Array<{ userId: string; action: string; ref: string }> = [];
    if (pod.arm === 'deposit') {
      const rsvpYes = Array.from(db.rsvps.values()).filter(
        (r) => r.meetup_id === meetupId && r.response === 'yes' && r.deposit === 'held'
      );
      for (const rsvp of rsvpYes) {
        // Check if they actually attended
        const attended = db.attendance.some(
          (a) => a.meetup_id === meetupId && a.user_id === rsvp.user_id
        );
        if (!attended) {
          // No-show
          const rsvpKey = `${meetupId}:${rsvp.user_id}`;
          if (noShowPolicy === 'forfeit' && rsvp.payment_ref) {
            await paymentAdapter.forfeit(rsvp.payment_ref);
            db.rsvps.set(rsvpKey, { ...rsvp, deposit: 'forfeited' });
            noShowActions.push({ userId: rsvp.user_id, action: 'forfeited', ref: rsvp.payment_ref });
          } else if (noShowPolicy === 'refund' && rsvp.payment_ref) {
            await paymentAdapter.refund(rsvp.payment_ref);
            db.rsvps.set(rsvpKey, { ...rsvp, deposit: 'refunded' });
            noShowActions.push({ userId: rsvp.user_id, action: 'refunded', ref: rsvp.payment_ref });
          }
        }
      }
    }

    // Mark meetup done
    db.meetups.set(meetupId, { ...meetup, status: 'done' });

    // AT21: low attendance task
    const totalAttendance = db.attendance.filter((a) => a.meetup_id === meetupId).length;
    let lowShowTask: string | null = null;
    if (totalAttendance < 4) {
      lowShowTask = `Table ${meetup.seq} had ${totalAttendance} attendee${totalAttendance !== 1 ? 's' : ''}. Consider reaching out to absent members.`;
      db.logAudit('low_show_closed', 'host-01', 'meetup', meetupId);
    }

    db.logAudit('host_close_meetup', 'host-01', 'meetup', meetupId);
    db.logEvent('meetup_done', undefined, pod.id, {
      meetup_id: meetupId,
      seq: meetup.seq,
      attendance: totalAttendance,
    });

    return NextResponse.json({
      success: true,
      meetup_id: meetupId,
      attendance: totalAttendance,
      no_show_actions: noShowActions,
      low_show_task: lowShowTask,
    });
  } catch (error) {
    console.error('POST /api/host/meetups/[id]/close error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
