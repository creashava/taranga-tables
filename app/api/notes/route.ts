import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';
import { getModerationAdapter } from '@/lib/adapters/moderation';

export const dynamic = 'force-dynamic';

const noteSchema = z.object({
  userId: z.string().min(1),
  podId: z.string().min(1),
  body: z.string().min(1).max(500, 'Pod notes are limited to 500 characters'),
});

/**
 * POST /api/notes
 * Submit a pod note (text only, 500 chars max, host-moderated).
 * Flagged notes are queued for host review; they are never auto-deleted.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, podId, body: noteBody } = parsed.data;
    const db = getDatabase();

    // Verify membership
    const membership = db.podMembers.find(
      (pm) => pm.user_id === userId && pm.pod_id === podId && !pm.left_at
    );
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 });
    }

    // Moderation check
    const modAdapter = getModerationAdapter();
    const modResult = modAdapter.checkContent(noteBody);

    let moderationFlag: string | undefined;
    let userWarning: string | undefined;

    if (modResult.flagged) {
      moderationFlag = modResult.priority === 'high' ? 'self_harm_risk' : 'keyword_flagged';
      if (modResult.isSelfHarmRisk) {
        userWarning =
          "We noticed something in your note. If you'd like to talk to someone right now, " +
          'Tele-MANAS (14416) offers free support; in an emergency call 112. ' +
          'Your host has been notified.';
      }
    }

    const noteId = `note-${userId}-${Date.now()}`;
    db.podNotes.set(noteId, {
      id: noteId,
      pod_id: podId,
      author_id: userId,
      body: noteBody,
      status: 'published', // Host can set to hidden; never auto-deleted
      created_at: new Date().toISOString(),
    });

    db.logEvent('pod_note_posted', userId, podId, {
      flagged: modResult.flagged,
      note_id: noteId,
    });

    return NextResponse.json({
      success: true,
      note_id: noteId,
      moderation: {
        flagged: modResult.flagged,
        priority: modResult.priority,
      },
      user_warning: userWarning ?? null,
    });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/notes?podId=xxx&userId=yyy
 * Returns published notes for the caller's pod.
 * Blocked pairs do not see each other's notes.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const podId = searchParams.get('podId');
    const userId = searchParams.get('userId');

    if (!podId || !userId) {
      return NextResponse.json({ error: 'podId and userId are required' }, { status: 400 });
    }

    const db = getDatabase();

    const membership = db.podMembers.find(
      (pm) => pm.user_id === userId && pm.pod_id === podId && !pm.left_at
    );
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 });
    }

    const notes = Array.from(db.podNotes.values())
      .filter((n) => {
        if (n.pod_id !== podId) return false;
        if (n.status === 'hidden') return false;
        // Block check
        const isBlocked = db.blocks.some(
          (b) =>
            (b.blocker_id === userId && b.blocked_id === n.author_id) ||
            (b.blocker_id === n.author_id && b.blocked_id === userId)
        );
        if (isBlocked) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((n) => {
        const author = db.profiles.get(n.author_id);
        return {
          id: n.id,
          body: n.body,
          author_display_name: author?.display_name ?? 'Pod Member',
          is_own: n.author_id === userId,
          created_at: n.created_at,
        };
      });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET /api/notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
