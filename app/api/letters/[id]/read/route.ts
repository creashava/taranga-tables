import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';

const readSchema = z.object({
  reader_id: z.string().min(1),
});

/**
 * POST /api/letters/[id]/read
 * Mark a specific letter as read by the caller.
 * Only allowed if the reader is eligible to see it (unlock rule enforced).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const letterId = params.id;
    const body = await req.json();
    const parsed = readSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reader_id } = parsed.data;
    const db = getDatabase();
    const now = new Date();

    // Verify the letter exists
    const letter = db.letters.get(letterId);
    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    // Verify reader is eligible (re-run unlock check)
    const unlockedLetters = db.getUnlockedLettersForReader(reader_id, letter.seq, now);
    const isUnlocked = unlockedLetters.some((ul) => ul.letter.id === letterId);
    if (!isUnlocked) {
      return NextResponse.json(
        { error: 'Letter is not yet unlocked for this reader' },
        { status: 403 }
      );
    }

    db.logEvent('letter_revealed', reader_id, letter.pod_id, { letter_id: letterId, seq: letter.seq });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/letters/[id]/read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
