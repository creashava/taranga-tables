import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/memory-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id') || 'usr-closing';
  const db = getDatabase();

  if (!db.canSeeEvents(userId)) {
    return NextResponse.json({
      visible: false,
      events: [],
      reason: 'Taranga events are visible only after the Wave (closing or closed pod).',
    });
  }

  const events = db.getPublishedEvents(userId).map((e) => {
    const key = `${e.id}_${userId}`;
    const interest = db.eventInterests.get(key);
    return {
      id: e.id,
      title: e.title,
      blurb: e.blurb,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      place_name: e.place_name,
      is_interested: Boolean(interest),
    };
  });

  return NextResponse.json({
    visible: true,
    events,
  });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id') || 'usr-closing';
  const db = getDatabase();

  if (!db.canSeeEvents(userId)) {
    return NextResponse.json({ error: 'Not eligible to view Taranga events yet' }, { status: 403 });
  }

  try {
    const json = await request.json();
    const { event_id } = json;

    if (!event_id) {
      return NextResponse.json({ error: 'Missing event_id' }, { status: 400 });
    }

    const event = db.tarangaEvents.get(event_id);
    if (!event || event.status !== 'published') {
      return NextResponse.json({ error: 'Event not found or not published' }, { status: 404 });
    }

    const interest = db.recordEventInterest(userId, event_id);
    db.logEvent('event_interest_recorded', userId, undefined, { event_id });

    return NextResponse.json({ ok: true, interest });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record interest' }, { status: 400 });
  }
}
