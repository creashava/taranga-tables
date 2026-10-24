import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/memory-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id') || 'usr-a1';
  const db = getDatabase();

  const received = db.getReceivedAppreciations(userId);
  const detailed = received.map((a) => {
    const author = db.profiles.get(a.author_id);
    return {
      id: a.id,
      author_name: author?.display_name || 'Pod Member',
      body: a.body,
      created_at: a.created_at,
    };
  });

  return NextResponse.json({
    appreciations: detailed,
  });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id') || 'usr-a1';
  const db = getDatabase();

  try {
    const json = await request.json();
    const { meetup_id, recipient_id, body } = json;

    if (!meetup_id || !recipient_id || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (recipient_id === userId) {
      return NextResponse.json({ error: 'Cannot write a Seen card to yourself' }, { status: 400 });
    }

    const trimmed = body.trim();
    if (trimmed.length < 10 || trimmed.length > 200) {
      return NextResponse.json(
        { error: 'Seen card must be between 10 and 200 characters' },
        { status: 400 }
      );
    }

    const membership = db.podMembers.find((pm) => pm.user_id === userId && !pm.left_at);
    if (!membership) {
      return NextResponse.json({ error: 'Not in an active pod' }, { status: 403 });
    }

    const apprec = db.submitAppreciation(userId, membership.pod_id, meetup_id, recipient_id, trimmed);
    db.logEvent('seen_card_submitted', userId, membership.pod_id, {
      meetup_id,
      recipient_id,
    });

    return NextResponse.json({ ok: true, appreciation: apprec });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Submission failed' }, { status: 400 });
  }
}
