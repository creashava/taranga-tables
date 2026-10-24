import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/me
 * Immediate account and personal data deletion (Right to Erasure, AT16).
 * Profile and personal rows are removed.
 * event_log rows are anonymised (user_id set to null).
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || new URL(req.url).searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDatabase();

    const profile = db.profiles.get(userId);
    if (!profile) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // 1. Remove profile
    db.profiles.delete(userId);

    // 2. Remove consents
    for (const [key, consent] of Array.from(db.consents.entries())) {
      if (consent.user_id === userId) {
        db.consents.delete(key);
      }
    }

    // 3. Remove screening
    db.screenings.delete(userId);

    // 4. Remove letters authored by user
    for (const [letterId, letter] of Array.from(db.letters.entries())) {
      if (letter.author_id === userId) {
        db.letters.delete(letterId);
      }
    }

    // 5. Remove pod notes authored by user
    for (const [noteId, note] of Array.from(db.podNotes.entries())) {
      if (note.author_id === userId) {
        db.podNotes.delete(noteId);
      }
    }

    // 6. Remove RSVPs
    for (const [key, rsvp] of Array.from(db.rsvps.entries())) {
      if (rsvp.user_id === userId) {
        db.rsvps.delete(key);
      }
    }

    // 7. Remove stretch choices
    for (const [key, choice] of Array.from(db.stretchChoices.entries())) {
      if (choice.user_id === userId) {
        db.stretchChoices.delete(key);
      }
    }

    // 8. Remove pod memberships
    db.podMembers = db.podMembers.filter((pm) => pm.user_id !== userId);

    // 9. Remove feedback
    for (const [key, fb] of Array.from(db.feedback.entries())) {
      if (fb.user_id === userId) {
        db.feedback.delete(key);
      }
    }

    // 10. AT16: event_log.user_id is anonymised (set to null)
    let anonymizedLogCount = 0;
    for (const log of db.eventLogs) {
      if (log.user_id === userId) {
        log.user_id = undefined; // represented as undefined/null in json
        anonymizedLogCount++;
      }
    }

    // 11. Log audit record of deletion
    db.logAudit('account_deleted', undefined, 'profile', userId);

    console.log(
      `[ACCOUNT DELETION - AT16] Deleted profile ${userId}, removed personal rows, and anonymised ${anonymizedLogCount} event logs.`
    );

    return NextResponse.json({
      success: true,
      message: 'Account and personal data have been completely removed. Event logs have been anonymised.',
    });
  } catch (error) {
    console.error('DELETE /api/me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/me
 * Returns current member's profile summary.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || new URL(req.url).searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDatabase();
    const profile = db.profiles.get(userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('GET /api/me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
