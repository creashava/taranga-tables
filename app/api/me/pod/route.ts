import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/pod
 * Returns the caller's active pod: pod metadata, first names of all members,
 * next scheduled meetup, and aggregated hours-together count.
 * Data minimisation: returns display_name only for other members (AT10).
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const db = getDatabase();

    // Find caller's active pod membership
    const membership = db.podMembers.find(
      (pm) => pm.user_id === userId && !pm.left_at
    );
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of any active pod' }, { status: 404 });
    }

    const pod = db.pods.get(membership.pod_id);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    // Members: display_name only (AT10)
    const podMemberEntries = db.podMembers.filter(
      (pm) => pm.pod_id === membership.pod_id && !pm.left_at
    );
    const members = podMemberEntries.map((pm) => {
      const prof = db.profiles.get(pm.user_id);
      return {
        user_id: pm.user_id,
        display_name: prof?.display_name ?? 'Pod Member',
        is_self: pm.user_id === userId,
      };
    });

    // Next upcoming meetup
    const now = new Date();
    const upcomingMeetups = Array.from(db.meetups.values())
      .filter((m) => m.pod_id === pod.id && m.status === 'scheduled' && new Date(m.starts_at) > now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    const nextMeetup = upcomingMeetups[0] ?? null;

    // Hours Together: sum of completed meetup durations for members who attended
    const doneMeetups = Array.from(db.meetups.values()).filter(
      (m) => m.pod_id === pod.id && m.status === 'done'
    );
    let hoursTogether = 0;
    for (const m of doneMeetups) {
      const attended = db.attendance.filter((a) => a.meetup_id === m.id);
      if (attended.length > 0) {
        const durationMs = new Date(m.ends_at).getTime() - new Date(m.starts_at).getTime();
        hoursTogether += durationMs / (1000 * 60 * 60);
      }
    }
    hoursTogether = Math.round(hoursTogether * 10) / 10;

    const venue = pod.default_venue_id ? db.venues.get(pod.default_venue_id) : null;

    // Current (most recent completed meetup)
    const doneMeetupsSorted = Array.from(db.meetups.values())
      .filter((m) => m.pod_id === pod.id && m.status === 'done')
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
    const currentMeetup = doneMeetupsSorted[0] ?? null;

    db.logAudit('read_pod', userId, 'pod', pod.id);

    return NextResponse.json({
      pod: {
        id: pod.id,
        name: pod.name,
        status: pod.status,
        arm: pod.arm,
        deposit_inr: pod.deposit_inr,
      },
      members,
      next_meetup: nextMeetup
        ? {
            id: nextMeetup.id,
            seq: nextMeetup.seq,
            starts_at: nextMeetup.starts_at,
            ends_at: nextMeetup.ends_at,
            venue_name: venue?.name ?? null,
            venue_area: venue?.area ?? null,
          }
        : null,
      current_meetup: currentMeetup ? { id: currentMeetup.id, seq: currentMeetup.seq } : null,
      hours_together: hoursTogether,
    });
  } catch (error) {
    console.error('GET /api/me/pod error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
