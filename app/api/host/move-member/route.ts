import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { z } from 'zod';

const moveMemberSchema = z.object({
  userId: z.string().min(1),
  podId: z.string().min(1),
  action: z.enum(['remove', 'move']),
  newPodId: z.string().optional(),
  reason: z.string().min(3, 'A clear reason is required for safety/audit logging'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = moveMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, podId, action, newPodId, reason } = parsed.data;
    const db = getDatabase();

    const memberEntry = db.podMembers.find(
      (pm) => pm.pod_id === podId && pm.user_id === userId && !pm.left_at
    );

    if (!memberEntry) {
      return NextResponse.json({ error: 'Active pod membership not found' }, { status: 404 });
    }

    // Mark current membership as left
    memberEntry.left_at = new Date().toISOString();
    memberEntry.left_reason = reason;

    if (action === 'remove') {
      const prof = db.profiles.get(userId);
      if (prof) {
        prof.status = 'removed';
        db.profiles.set(userId, prof);
      }
      db.logAudit(`host_remove_member: ${reason}`, 'host-01', 'pod_members', `${podId}:${userId}`);
    } else if (action === 'move' && newPodId) {
      db.podMembers.push({
        pod_id: newPodId,
        user_id: userId,
        joined_at: new Date().toISOString(),
      });
      db.logAudit(`host_move_member to ${newPodId}: ${reason}`, 'host-01', 'pod_members', `${podId}->${newPodId}:${userId}`);
    }

    return NextResponse.json({
      success: true,
      message: `Member action "${action}" completed. Reason logged in audit log.`,
    });
  } catch (error) {
    console.error('Move member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
