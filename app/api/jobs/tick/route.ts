import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/memory-db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const expectedSecret = process.env.CRON_SECRET || 'dev_cron_secret';

  // Allow bypass in test/mock mode if no secret set
  if (process.env.NODE_ENV !== 'test' && token !== expectedSecret && !process.env.MOCK_MODE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDatabase();
  const now = new Date();

  // Current IST hour (Asia/Kolkata is UTC+5:30)
  const utcOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + utcOffsetMs);
  const currentIstHour = istDate.getUTCHours();
  const istDateString = istDate.toISOString().split('T')[0];

  let digestsQueued = 0;
  let lowTurnoutTasksCreated = 0;
  let podsTransitionedToClosing = 0;
  let bountiesExpired = 0;

  // --------------------------------------------------------------------------
  // Step 1: Daily Digests for users whose letter_hour == current IST hour (N5)
  // --------------------------------------------------------------------------
  for (const profile of db.profiles.values()) {
    if (profile.role !== 'member' || profile.status === 'withdrawn' || profile.status === 'removed') {
      continue;
    }

    // Only run if user's configured letter hour matches
    if (profile.letter_hour !== currentIstHour) {
      continue;
    }

    // N5: at most one routine notification per user per day
    const notifKey = `daily-${profile.id}-${istDateString}`;
    if (db.notifications.has(notifKey)) {
      continue;
    }

    const membership = db.podMembers.find((pm) => pm.user_id === profile.id && !pm.left_at);
    const pod = membership ? db.pods.get(membership.pod_id) : undefined;

    const digestLines: Array<{ key: string; reason: string }> = [];

    // Line 1: low_turnout
    if (pod) {
      const meetups = Array.from(db.meetups.values()).filter((m) => m.pod_id === pod.id && m.status === 'scheduled');
      const hasLowTurnout = meetups.some((m) => m.low_turnout_flagged_at !== undefined);
      if (hasLowTurnout) {
        digestLines.push({
          key: 'low_turnout',
          reason: 'You’re getting this because your table may move.',
        });
      }
    }

    // Line 2: table_soon (meetup starts before next letter hour)
    if (pod && digestLines.length < 3) {
      const upcomingMeetup = Array.from(db.meetups.values()).find((m) => {
        if (m.pod_id !== pod.id || m.status !== 'scheduled') return false;
        const startsAt = new Date(m.starts_at).getTime();
        const diffHours = (startsAt - now.getTime()) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 24;
      });
      if (upcomingMeetup) {
        digestLines.push({
          key: 'table_soon',
          reason: 'You’re getting this because you RSVP’d to a table tomorrow or today.',
        });
      }
    }

    // Line 3: letter_ready
    if (pod && digestLines.length < 3) {
      const unlocked = db.getUnlockedLettersForReader(profile.id, 1, now);
      if (unlocked.length > 0) {
        digestLines.push({
          key: 'letter_ready',
          reason: 'You’re getting this because your pod has a new letter.',
        });
      }
    }

    // Line 4: closing_invite
    if (pod && pod.status === 'closing' && digestLines.length < 3) {
      digestLines.push({
        key: 'closing_invite',
        reason: 'You’re getting this because your Wave is ending.',
      });
    }

    if (digestLines.length > 0) {
      const combinedReason = digestLines.map((l) => l.reason).join(' ');
      db.notifications.set(notifKey, {
        id: notifKey,
        user_id: profile.id,
        kind: 'daily_digest',
        channel: 'email',
        template_key: 'daily',
        reason_text: combinedReason,
        scheduled_for: now.toISOString(),
        sent_at: now.toISOString(),
        status: 'sent',
      });
      digestsQueued++;
    }
  }

  // --------------------------------------------------------------------------
  // Step 2: Low turnout check (23 to 25 hours ahead, < 4 yes RSVPs, N16)
  // --------------------------------------------------------------------------
  for (const meetup of db.meetups.values()) {
    if (meetup.status !== 'scheduled' || meetup.low_turnout_flagged_at) {
      continue;
    }

    const meetupTime = new Date(meetup.starts_at).getTime();
    const hoursUntilMeetup = (meetupTime - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilMeetup >= 23 && hoursUntilMeetup <= 25) {
      const yesRsvps = Array.from(db.rsvps.values()).filter(
        (r) => r.meetup_id === meetup.id && r.response === 'yes'
      ).length;

      if (yesRsvps < 4) {
        meetup.low_turnout_flagged_at = now.toISOString();

        const taskId = `task-low-turnout-${meetup.id}`;
        if (!db.hostTasks.has(taskId)) {
          db.hostTasks.set(taskId, {
            id: taskId,
            pod_id: meetup.pod_id,
            kind: 'reschedule',
            body: `Table ${meetup.seq} has only ${yesRsvps} confirmed RSVPs 24h prior. Host review required to reschedule or merge.`,
            due_at: now.toISOString(),
            created_at: now.toISOString(),
          });
          lowTurnoutTasksCreated++;
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Step 3: Pod status transitions (Day 28: wave_start + 28 days -> closing)
  // --------------------------------------------------------------------------
  for (const pod of db.pods.values()) {
    if ((pod.status === 'letters' || pod.status === 'tables') && pod.wave_start) {
      const startDate = new Date(pod.wave_start).getTime();
      const daysSinceStart = (now.getTime() - startDate) / (1000 * 60 * 60 * 24);

      if (daysSinceStart >= 28) {
        pod.status = 'closing';
        podsTransitionedToClosing++;
        db.logEvent('pod_transitioned_to_closing', undefined, pod.id, { daysSinceStart });
      }
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: Expiry of Bounties
  // --------------------------------------------------------------------------
  for (const bounty of db.bounties.values()) {
    if (bounty.status === 'open') {
      const endTime = new Date(bounty.ends_at).getTime();
      if (now.getTime() > endTime) {
        bounty.status = 'closed';
        bountiesExpired++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    executed_at: now.toISOString(),
    ist_hour: currentIstHour,
    digests_queued: digestsQueued,
    low_turnout_tasks_created: lowTurnoutTasksCreated,
    pods_transitioned_to_closing: podsTransitionedToClosing,
    bounties_expired: bountiesExpired,
  });
}

export async function GET(request: Request) {
  return POST(request);
}
