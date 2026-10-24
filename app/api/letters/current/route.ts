import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { calculateRevealTime } from '@/lib/db/time';

export const dynamic = 'force-dynamic';

/**
 * GET /api/letters/current
 * Returns: today's letter prompt for the next unwritten seq, the caller's
 * own letter state for that seq (draft or submitted), and all letters from
 * pod-mates that are currently unlocked (AT6, AT7).
 *
 * The unlock rule (Section 7.3):
 *   Reader U may see letter L (author A, seq N, same pod) only if:
 *   - A is not U
 *   - L is not hidden
 *   - U has a submitted letter with seq N in the same pod
 *   - Neither user has blocked the other
 *   - now >= reveal_at
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const db = getDatabase();
    const now = new Date();

    const membership = db.podMembers.find(
      (pm) => pm.user_id === userId && !pm.left_at
    );
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of any active pod' }, { status: 404 });
    }

    const readerProfile = db.profiles.get(userId);
    if (!readerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Determine current seq: lowest seq for which user hasn't submitted
    const ownLetters = Array.from(db.letters.values()).filter(
      (l) => l.author_id === userId && l.pod_id === membership.pod_id
    );
    const submittedSeqs = new Set(
      ownLetters.filter((l) => l.status !== 'draft').map((l) => l.seq)
    );

    // Current active seq (1, 2, or 3). If all 3 done, return closing state.
    let currentSeq: number | null = null;
    for (const seq of [1, 2, 3]) {
      if (!submittedSeqs.has(seq)) {
        currentSeq = seq;
        break;
      }
    }

    // Get the prompt for current seq
    const promptForSeq = (seq: number) => {
      return Array.from(db.prompts.values()).find(
        (p) => p.kind === 'letter' && p.level === seq && p.active
      ) ?? null;
    };

    // Own draft for current seq (if any)
    const ownDraft = currentSeq
      ? ownLetters.find((l) => l.seq === currentSeq && l.status === 'draft') ?? null
      : null;

    // Collect all seq's unlocked letters
    const allUnlocked: Array<{
      letter_id: string;
      author_display_name: string;
      seq: number;
      body: string;
      submitted_at: string;
      reveal_at: string;
      read: boolean;
    }> = [];

    for (const seq of [1, 2, 3]) {
      const unlocked = db.getUnlockedLettersForReader(userId, seq, now);
      for (const { letter, author_name, reveal_at } of unlocked) {
        allUnlocked.push({
          letter_id: letter.id,
          author_display_name: author_name,
          seq: letter.seq,
          body: letter.body,
          submitted_at: letter.submitted_at,
          reveal_at: reveal_at.toISOString(),
          read: false, // LetterRead table not tracked in demo; always false for now
        });
      }
    }

    // Build per-seq reveal-time preview for unsubmitted letters
    // (tells UI "letter unlocks at 8pm" even before reveal)
    const podPeers = db.podMembers.filter(
      (pm) => pm.pod_id === membership.pod_id && pm.user_id !== userId && !pm.left_at
    );
    const pendingUnlocks: Array<{ author_display_name: string; seq: number; reveal_at: string }> = [];
    if (currentSeq !== null) {
      const readerLetter = ownLetters.find(
        (l) => l.seq === currentSeq && l.status !== 'draft'
      );
      if (readerLetter) {
        for (const pm of podPeers) {
          const peerLetter = Array.from(db.letters.values()).find(
            (l) =>
              l.author_id === pm.user_id &&
              l.pod_id === membership.pod_id &&
              l.seq === currentSeq &&
              l.status !== 'draft' &&
              l.status !== 'hidden'
          );
          if (peerLetter) {
            const revealAt = calculateRevealTime(
              peerLetter.submitted_at,
              readerLetter.submitted_at,
              readerProfile.letter_hour
            );
            if (now < revealAt) {
              const peerProfile = db.profiles.get(pm.user_id);
              pendingUnlocks.push({
                author_display_name: peerProfile?.display_name ?? 'Pod Member',
                seq: currentSeq,
                reveal_at: revealAt.toISOString(),
              });
            }
          }
        }
      }
    }

    const allDone = currentSeq === null;

    return NextResponse.json({
      current_seq: currentSeq,
      all_done: allDone,
      prompt: currentSeq ? promptForSeq(currentSeq) : null,
      own_draft: ownDraft
        ? { id: ownDraft.id, body: ownDraft.body, seq: ownDraft.seq }
        : null,
      own_submitted_seqs: Array.from(submittedSeqs),
      unlocked_letters: allUnlocked,
      pending_unlocks: pendingUnlocks,
      letter_hour: readerProfile.letter_hour,
    });
  } catch (error) {
    console.error('GET /api/letters/current error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
