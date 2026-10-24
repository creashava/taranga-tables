import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getNotifyAdapter } from '@/lib/adapters/notify';

/**
 * POST /api/notifications/queue-letters
 * Scheduled job (Section 7.4): queue_letter_notifications
 * Queues at most ONE email per user per day at their letter_hour,
 * only if something new unlocked.
 *
 * AT9: at most one notification per day, each with a non-empty reason_text.
 *
 * In the mock: this route is called by a cron trigger. In production it would
 * be called by a Supabase pg_cron or Vercel Cron job.
 */
export async function POST(req: NextRequest) {
  try {
    // Simple cron auth guard (shared secret via env)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const db = getDatabase();
    const now = new Date();

    // Asia/Kolkata offset
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(now.getTime() + IST_OFFSET_MS);
    const todayDateStr = todayIST.toISOString().slice(0, 10); // YYYY-MM-DD in IST

    const notify = getNotifyAdapter();
    const queued: string[] = [];

    for (const [userId, profile] of db.profiles.entries()) {
      if (profile.role !== 'member') continue;

      const membership = db.podMembers.find(
        (pm) => pm.user_id === userId && !pm.left_at
      );
      if (!membership) continue;

      // Check if we already queued a notification for this user today (AT9)
      const alreadyQueued = Array.from(db.notifications.values()).some((n) => {
        if (n.user_id !== userId) return false;
        if (n.kind !== 'letter_unlock') return false;
        const scheduledIST = new Date(new Date(n.scheduled_for).getTime() + IST_OFFSET_MS);
        return scheduledIST.toISOString().slice(0, 10) === todayDateStr;
      });

      if (alreadyQueued) continue;

      // Check if any new letters unlocked today for this user
      const unlockedLetters: Array<{ letter_id: string; seq: number }> = [];
      for (const seq of [1, 2, 3]) {
        const unlocked = db.getUnlockedLettersForReader(userId, seq, now);
        for (const { letter } of unlocked) {
          unlockedLetters.push({ letter_id: letter.id, seq: letter.seq });
        }
      }

      if (unlockedLetters.length === 0) continue;

      // Schedule notification at user's letter_hour in IST
      const scheduleUTC = new Date(
        Date.UTC(
          todayIST.getUTCFullYear(),
          todayIST.getUTCMonth(),
          todayIST.getUTCDate(),
          profile.letter_hour,
          0,
          0,
          0
        ) - IST_OFFSET_MS
      );

      const notifId = `notif-letter-${userId}-${todayDateStr}`;
      const reasonText =
        "You're getting this because your pod has a new letter waiting for you.";

      db.notifications.set(notifId, {
        id: notifId,
        user_id: userId,
        kind: 'letter_unlock',
        channel: 'email',
        template_key: 'letter_unlock',
        reason_text: reasonText,
        scheduled_for: scheduleUTC.toISOString(),
        status: 'queued',
      });

      // In mock mode, fire the ConsoleNotifyAdapter immediately
      await notify.send({
        userId,
        channel: 'email',
        templateKey: 'letter_unlock',
        reasonText,
        payload: {
          display_name: profile.display_name,
          letters_count: unlockedLetters.length,
        },
      });

      queued.push(userId);
    }

    return NextResponse.json({ success: true, queued_for: queued.length });
  } catch (error) {
    console.error('POST /api/notifications/queue-letters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
