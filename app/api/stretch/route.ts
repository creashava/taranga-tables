import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';
import { getModerationAdapter } from '@/lib/adapters/moderation';

export const dynamic = 'force-dynamic';

const stretchSchema = z.object({
  userId: z.string().min(1),
  podId: z.string().min(1),
  promptId: z.string().min(1),
  action: z.enum(['choose', 'skip', 'complete']),
});

/**
 * POST /api/stretch
 * Choose, skip, or complete a Stretch card.
 * Skipping carries no penalty and triggers no follow-up (R6, R7).
 * Copy is checked against ban list — no guilt language allowed.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = stretchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, podId, promptId, action } = parsed.data;
    const db = getDatabase();

    // Verify membership
    const membership = db.podMembers.find(
      (pm) => pm.user_id === userId && pm.pod_id === podId && !pm.left_at
    );
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 });
    }

    // Verify prompt exists and is a stretch prompt
    const prompt = db.prompts.get(promptId);
    if (!prompt || prompt.kind !== 'stretch') {
      return NextResponse.json({ error: 'Invalid stretch prompt' }, { status: 404 });
    }

    const choiceId = `sc-${userId}-${podId}-${promptId}`;
    const now = new Date().toISOString();

    const existing = db.stretchChoices.get(choiceId);

    if (action === 'choose') {
      db.stretchChoices.set(choiceId, {
        id: choiceId,
        user_id: userId,
        pod_id: podId,
        prompt_id: promptId,
        chosen_at: existing?.chosen_at ?? now,
        skipped: false,
      });
      db.logEvent('stretch_chosen', userId, podId, { prompt_id: promptId });
    } else if (action === 'skip') {
      // Skip: no penalty, no follow-up nag (R6)
      db.stretchChoices.set(choiceId, {
        id: choiceId,
        user_id: userId,
        pod_id: podId,
        prompt_id: promptId,
        chosen_at: existing?.chosen_at ?? now,
        skipped: true,
      });
      db.logEvent('stretch_skipped', userId, podId, { prompt_id: promptId });
    } else if (action === 'complete') {
      db.stretchChoices.set(choiceId, {
        id: choiceId,
        user_id: userId,
        pod_id: podId,
        prompt_id: promptId,
        chosen_at: existing?.chosen_at ?? now,
        completed_at: now,
        skipped: false,
      });
      db.logEvent('stretch_completed', userId, podId, { prompt_id: promptId });
    }

    // Skip message copy (R6, no guilt)
    const skipMessage = action === 'skip' ? 'No problem. Maybe another time.' : null;

    return NextResponse.json({
      success: true,
      action,
      skip_message: skipMessage,
    });
  } catch (error) {
    console.error('POST /api/stretch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/stretch?podId=xxx&userId=yyy
 * Returns available stretch prompts and the member's current choice state.
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

    // Verify membership
    const membership = db.podMembers.find(
      (pm) => pm.user_id === userId && pm.pod_id === podId && !pm.left_at
    );
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this pod' }, { status: 403 });
    }

    const stretchPrompts = Array.from(db.prompts.values())
      .filter((p) => p.kind === 'stretch')
      .sort((a, b) => a.level - b.level);

    const userChoices = Array.from(db.stretchChoices.values()).filter(
      (sc) => sc.user_id === userId && sc.pod_id === podId
    );

    return NextResponse.json({
      prompts: stretchPrompts,
      choices: userChoices,
    });
  } catch (error) {
    console.error('GET /api/stretch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
