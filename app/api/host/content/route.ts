import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/memory-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const hostId = request.headers.get('x-user-id') || 'host-01';
  const db = getDatabase();

  const host = db.profiles.get(hostId);
  if (host?.role !== 'host' && host?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const prompts = Array.from(db.prompts.values());
  const games = Array.from(db.games.values());
  const waypoints = Array.from(db.waypoints.values());
  const bounties = Array.from(db.bounties.values());
  const outbox = Array.from(db.notifications.values()).slice(-20);

  return NextResponse.json({
    prompts,
    games,
    waypoints,
    bounties,
    outbox,
  });
}
