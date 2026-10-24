import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';

const blockSchema = z.object({
  blockerId: z.string().min(1),
  blockedId: z.string().min(1),
  reason: z.string().optional(),
});

/**
 * POST /api/block
 * Block another member.
 * AT13: Both users' letters and notes are hidden from each other.
 * The host is notified immediately, while the blocked person is NOT notified.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = blockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { blockerId, blockedId, reason } = parsed.data;
    if (blockerId === blockedId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const db = getDatabase();

    // Check if already blocked
    const alreadyBlocked = db.blocks.some(
      (b) => b.blocker_id === blockerId && b.blocked_id === blockedId
    );
    if (!alreadyBlocked) {
      db.blocks.push({
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: new Date().toISOString(),
      });
    }

    // AT13: Notify host (not the blocked user)
    const blocker = db.profiles.get(blockerId);
    const blocked = db.profiles.get(blockedId);
    const hostTaskMessage = `Member block recorded: ${blocker?.display_name || blockerId} blocked ${blocked?.display_name || blockedId}. Manual pod rematching required. Reason: ${reason || 'Not specified'}`;

    db.logAudit('member_block_created', blockerId, 'block', `${blockerId}:${blockedId}`);
    db.logEvent('member_blocked', blockerId, undefined, {
      blocked_id: blockedId,
    });

    console.log(`[HOST TASK - AT13] ${hostTaskMessage}`);

    return NextResponse.json({
      success: true,
      message: 'Member has been blocked. Their letters and notes are now hidden from you, and yours from them.',
    });
  } catch (error) {
    console.error('POST /api/block error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
