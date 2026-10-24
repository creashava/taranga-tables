import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { z } from 'zod';

const createPodSchema = z.object({
  name: z.string().min(2),
  arm: z.enum(['free', 'deposit']),
  depositInr: z.number().int().min(0).default(0),
  womenOnly: z.boolean().default(false),
  memberIds: z.array(z.string()).min(5).max(7),
  cycleId: z.string().default('c-01'),
  venueId: z.string().default('v-01'),
});

export async function GET() {
  const db = getDatabase();
  const pods = Array.from(db.pods.values()).map((pod) => {
    const members = db.podMembers
      .filter((pm) => pm.pod_id === pod.id && !pm.left_at)
      .map((pm) => {
        const prof = db.profiles.get(pm.user_id);
        return {
          userId: pm.user_id,
          displayName: prof?.display_name || 'Member',
          joinedAt: pm.joined_at,
        };
      });

    const meetups = Array.from(db.meetups.values()).filter((m) => m.pod_id === pod.id);

    return {
      ...pod,
      members,
      meetups,
    };
  });

  return NextResponse.json({ success: true, pods });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createPodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, arm, depositInr, womenOnly, memberIds, cycleId, venueId } = parsed.data;
    const db = getDatabase();

    const podId = `pod-${Date.now().toString(36)}`;

    // Create Pod
    db.pods.set(podId, {
      id: podId,
      cycle_id: cycleId,
      name,
      status: 'letters', // Ready for write-to-unlock letters
      women_only: womenOnly,
      capacity: memberIds.length,
      arm,
      deposit_inr: arm === 'deposit' ? (depositInr > 0 ? depositInr : 200) : 0,
      host_id: 'host-01',
      default_venue_id: venueId,
      created_at: new Date().toISOString(),
    });

    // Add members and update their profile status to 'in_pod'
    memberIds.forEach((uid) => {
      db.podMembers.push({
        pod_id: podId,
        user_id: uid,
        joined_at: new Date().toISOString(),
      });

      const prof = db.profiles.get(uid);
      if (prof) {
        prof.status = 'in_pod';
        db.profiles.set(uid, prof);
      }
    });

    // Audit log (Section 6.3 #4: "Host approves, edits or rejects. Every change writes to audit_log.")
    db.logAudit('host_confirm_pod', 'host-01', 'pods', podId);
    db.logEvent('pod_assigned', undefined, podId, { arm, memberCount: memberIds.length });

    return NextResponse.json({
      success: true,
      podId,
      message: `Pod ${name} confirmed with ${memberIds.length} members.`,
    });
  } catch (error) {
    console.error('Host create pod error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
