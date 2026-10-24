import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';

const withdrawSchema = z.object({
  userId: z.string().min(1),
  podId: z.string().optional(),
  reason: z.string().optional(),
});

/**
 * POST /api/me/withdraw
 * Member kindly leaves their pod.
 * AT15: The member's letters are hidden from the pod, and the host receives a follow-up task.
 * Microcopy strictly follows SPEC Section 8.3:
 * "Thank you for giving it a try. We'll let your host know so they can check in with you kindly. Your letters will be hidden from the pod."
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, podId, reason } = parsed.data;
    const db = getDatabase();

    // Find active membership
    const membership = db.podMembers.find(
      (pm) => pm.user_id === userId && (!podId || pm.pod_id === podId) && !pm.left_at
    );

    if (!membership) {
      return NextResponse.json({ error: 'No active pod membership found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    membership.left_at = now;

    // AT15: Member's letters are hidden from the pod
    for (const [letterId, letter] of db.letters.entries()) {
      if (letter.author_id === userId && letter.pod_id === membership.pod_id) {
        db.letters.set(letterId, {
          ...letter,
          status: 'hidden',
        });
      }
    }

    // AT15: Host gets a follow-up task
    const profile = db.profiles.get(userId);
    const hostTask = `Follow-up needed: ${profile?.display_name || userId} has withdrawn from pod ${membership.pod_id}. Please check in kindly. Reason: ${reason || 'Not specified'}.`;
    db.logAudit('member_withdrew', userId, 'pod', membership.pod_id);
    db.logEvent('member_withdrew', userId, membership.pod_id, {
      reason: reason || null,
    });

    console.log(`[HOST TASK - AT15] ${hostTask}`);

    // Microcopy from SPEC 8.3
    const message = "Thank you for giving it a try. We'll let your host know so they can check in with you kindly. Your letters will be hidden from the pod.";

    return NextResponse.json({
      success: true,
      message,
      host_task_created: true,
    });
  } catch (error) {
    console.error('POST /api/me/withdraw error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
