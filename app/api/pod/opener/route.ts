import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/memory-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id') || 'usr-a1';
  const db = getDatabase();

  const membership = db.podMembers.find((pm) => pm.user_id === userId && !pm.left_at);
  if (!membership) {
    return NextResponse.json({ error: 'No active pod found' }, { status: 404 });
  }

  const pod = db.pods.get(membership.pod_id);
  if (!pod) {
    return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
  }

  const arm = pod.opener_arm || 'none';
  let cards: Array<{ id: string; prompt: string; is_pivot?: boolean }> = [];

  if (arm === 'peeve') {
    const peeves = Array.from(db.prompts.values()).filter((p) => p.kind === 'peeve' && p.active);
    const pivot = Array.from(db.prompts.values()).find((p) => p.kind === 'pivot' && p.active);
    
    // Each peeve card is followed by the pivot
    peeves.forEach((pv) => {
      cards.push({ id: pv.id, prompt: pv.body_en, is_pivot: false });
      if (pivot) {
        cards.push({ id: `${pv.id}-pivot`, prompt: pivot.body_en, is_pivot: true });
      }
    });
  } else if (arm === 'favourites') {
    const favs = Array.from(db.prompts.values()).filter((p) => p.kind === 'favourite' && p.active);
    favs.forEach((f) => {
      cards.push({ id: f.id, prompt: f.body_en, is_pivot: false });
    });
  }

  return NextResponse.json({
    pod_name: pod.name,
    opener_arm: arm,
    cards,
  });
}
