import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';
import { getModerationAdapter } from '@/lib/adapters/moderation';

const letterSchema = z.object({
  userId: z.string().min(1),
  seq: z.number().int().min(1).max(3),
  promptId: z.string().min(1),
  body: z.string().min(20, 'Letter must be at least 20 characters').max(1200, 'Letter must be at most 1200 characters'),
  status: z.enum(['draft', 'submitted']).default('submitted'),
});

/**
 * POST /api/letters
 * Submit or save a draft letter (seq 1-3) for the calling member.
 * Runs moderation; self-harm keywords → high-priority flag + helpline message.
 * Enforces: one letter per seq per pod member; 20-1200 chars.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = letterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, seq, promptId, body: letterBody, status } = parsed.data;

    const db = getDatabase();

    // Verify membership
    const membership = db.podMembers.find(
      (pm) => pm.user_id === userId && !pm.left_at
    );
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of any active pod' }, { status: 403 });
    }

    // Check if already submitted (not draft) for this seq
    const existing = Array.from(db.letters.values()).find(
      (l) => l.author_id === userId && l.pod_id === membership.pod_id && l.seq === seq
    );

    if (existing && existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Letter already submitted for this sequence' },
        { status: 409 }
      );
    }

    // Moderation check
    const modAdapter = getModerationAdapter();
    const modResult = modAdapter.checkContent(letterBody);

    let moderationFlag: string | undefined;
    let userWarning: string | undefined;

    if (modResult.flagged) {
      moderationFlag = modResult.priority === 'high' ? 'self_harm_risk' : 'keyword_flagged';
      if (modResult.isSelfHarmRisk) {
        // Self-harm: show helpline, flag for host, do NOT delete (Section 9.3)
        userWarning =
          "We noticed something in your letter. If you'd like to talk to someone right now, " +
          'Tele-MANAS (14416) offers free support; in an emergency call 112. ' +
          'Your host has been notified and will follow up personally.';
      }
    }

    // Upsert letter (draft → submitted, or new)
    const letterId = existing?.id ?? `letter-${userId}-${seq}-${Date.now()}`;
    const now = new Date().toISOString();

    db.letters.set(letterId, {
      id: letterId,
      pod_id: membership.pod_id,
      author_id: userId,
      prompt_id: promptId,
      seq,
      body: letterBody,
      status,
      moderation_flag: moderationFlag,
      submitted_at: status === 'submitted' ? now : (existing?.submitted_at ?? now),
    });

    if (status === 'submitted') {
      db.logEvent('letter_submitted', userId, membership.pod_id, { seq, flagged: modResult.flagged });
    }

    return NextResponse.json({
      success: true,
      letter_id: letterId,
      status,
      moderation: {
        flagged: modResult.flagged,
        priority: modResult.priority,
        host_action_required: modResult.hostActionRequired,
      },
      user_warning: userWarning ?? null,
    });
  } catch (error) {
    console.error('POST /api/letters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
