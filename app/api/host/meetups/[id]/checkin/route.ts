import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';
import { getPaymentAdapter } from '@/lib/adapters/payments';

const checkinSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
});

/**
 * POST /api/host/meetups/[id]/checkin  (H5 Host Check-in)
 * Host marks attendance for one or more members.
 * AT11: If pod is deposit arm, automatically refunds the hold on check-in.
 * AT21: After marking attendance, checks if < 4 attended (low-show flag).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetupId = params.id;
    const body = await req.json();
    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userIds } = parsed.data;
    const db = getDatabase();
    const paymentAdapter = getPaymentAdapter();
    const now = new Date().toISOString();

    const meetup = db.meetups.get(meetupId);
    if (!meetup) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }

    const pod = db.pods.get(meetup.pod_id);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    const checkedIn: string[] = [];
    const refunds: Array<{ userId: string; ref: string; amountInr: number }> = [];

    for (const userId of userIds) {
      // Verify membership
      const membership = db.podMembers.find(
        (pm) => pm.user_id === userId && pm.pod_id === pod.id && !pm.left_at
      );
      if (!membership) continue;

      // Record attendance (idempotent)
      const alreadyCheckedIn = db.attendance.some(
        (a) => a.meetup_id === meetupId && a.user_id === userId
      );
      if (!alreadyCheckedIn) {
        db.attendance.push({
          meetup_id: meetupId,
          user_id: userId,
          checked_in_at: now,
          marked_by: 'host-01',
        });
        checkedIn.push(userId);

        // AT11: deposit arm → auto-refund on check-in
        if (pod.arm === 'deposit') {
          const rsvpKey = `${meetupId}:${userId}`;
          const rsvp = db.rsvps.get(rsvpKey);
          if (rsvp && rsvp.payment_ref && rsvp.deposit === 'held') {
            const refundResult = await paymentAdapter.refund(rsvp.payment_ref);
            if (refundResult.success) {
              db.rsvps.set(rsvpKey, { ...rsvp, deposit: 'refunded' });
              const profile = db.profiles.get(userId);
              refunds.push({
                userId,
                ref: rsvp.payment_ref,
                amountInr: pod.deposit_inr,
              });
              console.log(
                `[CHECKIN] Auto-refunded ₹${pod.deposit_inr} for ${profile?.display_name ?? userId} (ref: ${rsvp.payment_ref})`
              );
            }
          }
        }

        db.logEvent('attendance_marked', userId, pod.id, {
          meetup_id: meetupId,
          seq: meetup.seq,
        });

        if (pod.arm === 'deposit' && refunds.some((r) => r.userId === userId)) {
          db.logEvent('deposit_refunded', userId, pod.id, { meetup_id: meetupId });
        }
      }
    }

    db.logAudit('host_checkin', 'host-01', 'meetup', meetupId);

    // AT21: low-show check
    const totalAttendance = db.attendance.filter((a) => a.meetup_id === meetupId).length;
    let lowShowTask: string | null = null;
    if (totalAttendance < 4 && meetup.status !== 'done') {
      lowShowTask = `Low attendance for Table ${meetup.seq}: only ${totalAttendance} member${totalAttendance !== 1 ? 's' : ''} showed up. Consider following up with absent members.`;
      db.logAudit('low_show_flag', 'host-01', 'meetup', meetupId);
    }

    return NextResponse.json({
      success: true,
      checked_in: checkedIn,
      total_attendance: totalAttendance,
      refunds_processed: refunds,
      low_show_task: lowShowTask,
    });
  } catch (error) {
    console.error('POST /api/host/meetups/[id]/checkin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/host/meetups/[id]/checkin
 * Returns meetup details, members with RSVP status and check-in status.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetupId = params.id;
    const db = getDatabase();

    const meetup = db.meetups.get(meetupId);
    if (!meetup) {
      return NextResponse.json({ error: 'Meetup not found' }, { status: 404 });
    }

    const pod = db.pods.get(meetup.pod_id);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    const members = db.podMembers
      .filter((pm) => pm.pod_id === pod.id && !pm.left_at)
      .map((pm) => {
        const profile = db.profiles.get(pm.user_id);
        const rsvpKey = `${meetupId}:${pm.user_id}`;
        const rsvp = db.rsvps.get(rsvpKey);
        const attended = db.attendance.some(
          (a) => a.meetup_id === meetupId && a.user_id === pm.user_id
        );

        return {
          userId: pm.user_id,
          displayName: profile?.display_name ?? 'Member',
          rsvp: rsvp?.response ?? 'none',
          deposit: rsvp?.deposit ?? 'none',
          attended,
        };
      });

    const venue = meetup.venue_id ? db.venues.get(meetup.venue_id) : null;

    return NextResponse.json({
      meetup: {
        id: meetup.id,
        seq: meetup.seq,
        starts_at: meetup.starts_at,
        ends_at: meetup.ends_at,
        status: meetup.status,
        venue_name: venue?.name ?? null,
      },
      pod: {
        id: pod.id,
        name: pod.name,
        arm: pod.arm,
        deposit_inr: pod.deposit_inr,
      },
      members,
    });
  } catch (error) {
    console.error('GET /api/host/meetups/[id]/checkin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
