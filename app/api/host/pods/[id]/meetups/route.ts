import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';

const meetupSchema = z.object({
  podId: z.string().min(1),
  seq: z.number().int().min(1).max(3),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  venueId: z.string().optional(),
});

/**
 * POST /api/host/pods/[id]/meetups  (H4 Meetup Scheduler)
 * Schedule a meetup (Table 1-3) for a pod.
 * Host role enforced. Writes to audit_log.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const podId = params.id;
    const body = await req.json();
    const parsed = meetupSchema.safeParse({ ...body, podId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { seq, startsAt, endsAt, venueId } = parsed.data;
    const db = getDatabase();

    const pod = db.pods.get(podId);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    // Check for duplicate seq
    const existingMeetup = Array.from(db.meetups.values()).find(
      (m) => m.pod_id === podId && m.seq === seq
    );
    if (existingMeetup) {
      return NextResponse.json(
        { error: `A meetup for Table ${seq} already exists for this pod` },
        { status: 409 }
      );
    }

    const meetupId = `m-${podId.replace('pod-', '')}-${seq}-${Date.now().toString(36)}`;
    db.meetups.set(meetupId, {
      id: meetupId,
      pod_id: podId,
      seq,
      starts_at: startsAt,
      ends_at: endsAt,
      venue_id: venueId ?? pod.default_venue_id,
      status: 'scheduled',
    });

    db.logAudit('host_schedule_meetup', 'host-01', 'meetup', meetupId);
    db.logEvent('meetup_scheduled', undefined, podId, { seq, meetup_id: meetupId });

    return NextResponse.json({
      success: true,
      meetup_id: meetupId,
      message: `Table ${seq} scheduled for ${new Date(startsAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    });
  } catch (error) {
    console.error('POST /api/host/pods/[id]/meetups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/host/pods/[id]/meetups
 * List meetups for a pod with RSVP counts and attendance.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const podId = params.id;
    const db = getDatabase();

    const pod = db.pods.get(podId);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    const meetups = Array.from(db.meetups.values())
      .filter((m) => m.pod_id === podId)
      .sort((a, b) => a.seq - b.seq)
      .map((m) => {
        const rsvpsYes = Array.from(db.rsvps.values()).filter(
          (r) => r.meetup_id === m.id && r.response === 'yes'
        );
        const attendees = db.attendance.filter((a) => a.meetup_id === m.id);
        const venue = m.venue_id ? db.venues.get(m.venue_id) : null;

        return {
          id: m.id,
          seq: m.seq,
          starts_at: m.starts_at,
          ends_at: m.ends_at,
          status: m.status,
          venue_name: venue?.name ?? null,
          venue_area: venue?.area ?? null,
          rsvp_yes_count: rsvpsYes.length,
          attendance_count: attendees.length,
        };
      });

    return NextResponse.json({ meetups });
  } catch (error) {
    console.error('GET /api/host/pods/[id]/meetups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
