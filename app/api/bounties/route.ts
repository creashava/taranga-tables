import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/memory-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id') || 'usr-a1';
  const db = getDatabase();

  const membership = db.podMembers.find((pm) => pm.user_id === userId && !pm.left_at);
  const podId = membership?.pod_id;

  const openBounties = db.getOpenBounties().map((b) => {
    const wp = db.waypoints.get(b.waypoint_id);
    const joins = db.bountyJoins.filter((j) => j.bounty_id === b.id);
    const hasJoined = joins.some((j) => j.user_id === userId);

    return {
      id: b.id,
      title: b.title,
      description: b.description,
      waypoint_name: wp?.name || 'Public Waypoint',
      waypoint_area: wp?.area || 'Mysuru',
      group_min: b.group_min,
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      host_contact: b.host_contact,
      participant_count: joins.length,
      has_joined: hasJoined,
    };
  });

  const passportStamps = podId
    ? db.passportStamps
        .filter((s) => s.pod_id === podId)
        .map((s) => {
          const wp = db.waypoints.get(s.waypoint_id);
          return {
            waypoint_name: wp?.name || 'Waypoint',
            stamped_at: s.stamped_at,
          };
        })
    : [];

  return NextResponse.json({
    bounties: openBounties,
    passport_stamps: passportStamps,
  });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id') || 'usr-a1';
  const db = getDatabase();

  try {
    const json = await request.json();
    const { bounty_id } = json;

    if (!bounty_id) {
      return NextResponse.json({ error: 'Missing bounty_id' }, { status: 400 });
    }

    const bounty = db.bounties.get(bounty_id);
    if (!bounty || bounty.status !== 'open') {
      return NextResponse.json({ error: 'Bounty not available' }, { status: 404 });
    }

    const join = db.joinBounty(userId, bounty_id);
    db.logEvent('bounty_joined', userId, undefined, { bounty_id });

    return NextResponse.json({ ok: true, join });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to join bounty' }, { status: 400 });
  }
}
