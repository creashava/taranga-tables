import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/memory-db';
import { TarangaEvent } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const hostId = request.headers.get('x-user-id') || 'host-01';
  const db = getDatabase();

  const host = db.profiles.get(hostId);
  if (host?.role !== 'host' && host?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const events = Array.from(db.tarangaEvents.values()).map((e) => {
    const interests = Array.from(db.eventInterests.values()).filter((i) => i.event_id === e.id);
    const interestedMembers = interests.map((i) => {
      const p = db.profiles.get(i.user_id);
      return {
        user_id: i.user_id,
        display_name: p?.display_name || 'Member',
        attended: Boolean(i.attended_at),
      };
    });

    return {
      id: e.id,
      title: e.title,
      blurb: e.blurb,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      place_name: e.place_name,
      capacity: e.capacity,
      status: e.status,
      interested_count: interests.length,
      attended_count: interests.filter((i) => i.attended_at).length,
      interested_members: interestedMembers, // First names only
    };
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const hostId = request.headers.get('x-user-id') || 'host-01';
  const db = getDatabase();

  const host = db.profiles.get(hostId);
  if (host?.role !== 'host' && host?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const json = await request.json();
    const { action } = json;

    if (action === 'create') {
      const { title, blurb, starts_at, ends_at, place_name, capacity } = json;
      if (!title || !blurb || !starts_at || !ends_at || !place_name) {
        return NextResponse.json({ error: 'Missing required event fields' }, { status: 400 });
      }

      const id = `te-${Date.now()}`;
      const newEvent: TarangaEvent = {
        id,
        title,
        blurb,
        starts_at,
        ends_at,
        place_name,
        capacity: capacity ? Number(capacity) : undefined,
        status: 'published',
        created_by: hostId,
        created_at: new Date().toISOString(),
      };
      db.tarangaEvents.set(id, newEvent);
      db.logAudit('create_event', hostId, 'taranga_event', id);

      return NextResponse.json({ ok: true, event: newEvent });
    }

    if (action === 'mark_attendance') {
      const { user_id, event_id } = json;
      if (!user_id || !event_id) {
        return NextResponse.json({ error: 'Missing user_id or event_id' }, { status: 400 });
      }

      db.recordEventAttendance(hostId, user_id, event_id);
      db.logAudit('mark_event_attendance', hostId, 'event_interest', `${event_id}_${user_id}`);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 400 });
  }
}
