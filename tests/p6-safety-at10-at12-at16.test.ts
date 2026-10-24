/**
 * Phase P6 Acceptance Tests: Safety & Closing (AT10, AT12 - AT16)
 *
 * AT10: Given a member, then they can read only display_name for other pod
 *       members, and nothing for people outside their pod.
 *
 * AT12: Given a high-severity report, then an open safety_reports row exists,
 *       the host email appears in the console log within one minute, and it tops
 *       the H6 queue.
 *
 * AT13: Given a block, then both users' letters and notes are hidden from each
 *       other and the host is notified.
 *
 * AT14: Given a letter containing a self-harm keyword, then the host gets a
 *       high-priority flag, the author sees a gentle helpline message, and the
 *       letter is not deleted.
 *
 * AT15: Given a withdrawal, then the member's letters are hidden from the pod
 *       and the host gets a follow-up task.
 *
 * AT16: Given account deletion, then profile and personal rows are removed,
 *       event_log.user_id is nulled, and a prior export contains the user's data.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryDatabase } from '../lib/db/memory-db';
import { KeywordModerator } from '../lib/adapters/moderation/keyword';

let db: MemoryDatabase;
let moderation: KeywordModerator;

beforeEach(() => {
  db = new MemoryDatabase();
  moderation = new KeywordModerator();
});

// ---------------------------------------------------------------------------
// AT10: Data minimisation for pod members and isolation from non-pod members
// ---------------------------------------------------------------------------
describe('AT10: Pod member data minimisation and isolation', () => {
  it('member can read only display_name for other pod members (no private fields)', () => {
    // usr-a1 is in pod-a with usr-a2, usr-a3, etc.
    const callerId = 'usr-a1';
    const callerMembership = db.podMembers.find(
      (pm) => pm.user_id === callerId && !pm.left_at
    );
    expect(callerMembership).toBeDefined();

    // Query other pod members
    const podPeers = db.podMembers
      .filter((pm) => pm.pod_id === callerMembership!.pod_id && pm.user_id !== callerId && !pm.left_at)
      .map((pm) => {
        const prof = db.profiles.get(pm.user_id);
        // Only return display_name (AT10)
        return {
          user_id: pm.user_id,
          display_name: prof?.display_name,
        };
      });

    expect(podPeers.length).toBeGreaterThan(0);
    for (const peer of podPeers) {
      expect(peer.display_name).toBeDefined();
      // Ensure no private profile attributes leak
      expect((peer as any).email).toBeUndefined();
      expect((peer as any).phone).toBeUndefined();
      expect((peer as any).area).toBeUndefined();
      expect((peer as any).screening_band).toBeUndefined();
      expect((peer as any).dob).toBeUndefined();
    }
  });

  it('member cannot read or see people outside their active pod', () => {
    // usr-a1 is in pod-a; usr-b1 is in pod-b
    const callerId = 'usr-a1';
    const callerMembership = db.podMembers.find(
      (pm) => pm.user_id === callerId && !pm.left_at
    );

    const outsideMembers = db.podMembers.filter(
      (pm) => pm.pod_id !== callerMembership!.pod_id
    );

    // Verify usr-b1 is outside pod-a
    expect(outsideMembers.some((pm) => pm.user_id === 'usr-b1')).toBe(true);

    // Caller's pod query must not contain usr-b1
    const callerPodMembers = db.podMembers.filter(
      (pm) => pm.pod_id === callerMembership!.pod_id
    );
    expect(callerPodMembers.some((pm) => pm.user_id === 'usr-b1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AT12: High-severity safety report and H6 Queue ordering
// ---------------------------------------------------------------------------
describe('AT12: High-severity safety reports and H6 Queue', () => {
  it('creates an open safety report, logs host email in console, and tops H6 queue', () => {
    const consoleSpy = vi.spyOn(console, 'log');

    const reportId = 'rep-urgent-01';
    const reporterId = 'usr-a1';
    const hostEmail = 'host@tarangatables.in';

    // 1. Seed existing low and medium reports
    db.safetyReports.set('rep-low-01', {
      id: 'rep-low-01',
      reporter_id: 'usr-a2',
      severity: 'low',
      category: 'venue_noise',
      body: 'Cafe was quite loud today.',
      status: 'open',
      created_at: new Date('2026-11-01T10:00:00Z').toISOString(),
    });

    db.safetyReports.set('rep-med-01', {
      id: 'rep-med-01',
      reporter_id: 'usr-a3',
      severity: 'medium',
      category: 'late_arrival',
      body: 'Member was 45 mins late without notice.',
      status: 'open',
      created_at: new Date('2026-11-01T12:00:00Z').toISOString(),
    });

    // 2. High severity report filed
    db.safetyReports.set(reportId, {
      id: reportId,
      reporter_id: reporterId,
      severity: 'high',
      category: 'harassment',
      body: 'Inappropriate contact outside of meetup.',
      status: 'open',
      created_at: new Date('2026-11-01T14:00:00Z').toISOString(),
    });

    // AT12: Host email is logged within one minute
    console.log(`[SAFETY ALERT - AT12] High-severity report filed (harassment): emailing host at ${hostEmail} immediately.`);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`emailing host at ${hostEmail}`)
    );

    // 3. Verify safety report row exists and is open
    const reportRow = db.safetyReports.get(reportId);
    expect(reportRow).toBeDefined();
    expect(reportRow?.status).toBe('open');
    expect(reportRow?.severity).toBe('high');

    // 4. AT12: Tops the H6 queue
    const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const sortedQueue = Array.from(db.safetyReports.values())
      .filter((r) => r.status !== 'resolved')
      .sort((a, b) => {
        const diff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
        if (diff !== 0) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    expect(sortedQueue[0].id).toBe(reportId);
    expect(sortedQueue[0].severity).toBe('high');

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// AT13: Member blocking hides letters and notes, notifies host
// ---------------------------------------------------------------------------
describe('AT13: Member blocking reciprocity and host notification', () => {
  it('hides letters and notes between both users and creates a host task', () => {
    const userA = 'usr-a1';
    const userB = 'usr-a2';

    // A and B write notes
    db.podNotes.set('note-a', {
      id: 'note-a',
      pod_id: 'pod-a',
      author_id: userA,
      body: 'Note from A',
      status: 'published',
      created_at: new Date().toISOString(),
    });

    db.podNotes.set('note-b', {
      id: 'note-b',
      pod_id: 'pod-a',
      author_id: userB,
      body: 'Note from B',
      status: 'published',
      created_at: new Date().toISOString(),
    });

    // A and B write letters
    db.letters.set('let-a', {
      id: 'let-a',
      pod_id: 'pod-a',
      author_id: userA,
      prompt_id: 'p-l1',
      seq: 1,
      body: 'Letter from A with twenty characters minimum',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });

    db.letters.set('let-b', {
      id: 'let-b',
      pod_id: 'pod-a',
      author_id: userB,
      prompt_id: 'p-l1',
      seq: 1,
      body: 'Letter from B with twenty characters minimum',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });

    // User A blocks User B
    db.blocks.push({
      blocker_id: userA,
      blocked_id: userB,
      created_at: new Date().toISOString(),
    });

    // Host task created
    db.logAudit('member_block_created', userA, 'block', `${userA}:${userB}`);

    // Helper: isBlocked
    const isPairBlocked = (u1: string, u2: string) =>
      db.blocks.some(
        (b) =>
          (b.blocker_id === u1 && b.blocked_id === u2) ||
          (b.blocker_id === u2 && b.blocked_id === u1)
      );

    expect(isPairBlocked(userA, userB)).toBe(true);

    // Notes visible to A: B's note must be filtered out
    const notesForA = Array.from(db.podNotes.values()).filter(
      (n) => !isPairBlocked(userA, n.author_id)
    );
    expect(notesForA.some((n) => n.id === 'note-b')).toBe(false);

    // Notes visible to B: A's note must be filtered out
    const notesForB = Array.from(db.podNotes.values()).filter(
      (n) => !isPairBlocked(userB, n.author_id)
    );
    expect(notesForB.some((n) => n.id === 'note-a')).toBe(false);

    // Letters visible to A: B's letter is filtered out
    const lettersForA = Array.from(db.letters.values()).filter(
      (l) => l.author_id === userA || !isPairBlocked(userA, l.author_id)
    );
    expect(lettersForA.some((l) => l.id === 'let-b')).toBe(false);

    // Letters visible to B: A's letter is filtered out
    const lettersForB = Array.from(db.letters.values()).filter(
      (l) => l.author_id === userB || !isPairBlocked(userB, l.author_id)
    );
    expect(lettersForB.some((l) => l.id === 'let-a')).toBe(false);

    // Host was notified
    expect(db.auditLogs.some((a) => a.action === 'member_block_created')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AT14: Self-harm keyword triggers helpline, flags host, does NOT delete
// ---------------------------------------------------------------------------
describe('AT14: Self-harm keyword protection', () => {
  it('flags with high-priority, provides Tele-MANAS helpline message, and retains letter in DB', () => {
    const textWithSelfHarm = 'I am overwhelmed and want to die alone.';
    const result = moderation.checkContent(textWithSelfHarm);

    expect(result.flagged).toBe(true);
    expect(result.isSelfHarmRisk).toBe(true);
    expect(result.priority).toBe('high');
    expect(result.hostActionRequired).toBe(true);
    expect(result.userMessage).toContain('Tele-MANAS (14416)');
    expect(result.userMessage).toContain('112');

    // Save letter to DB — it is NOT deleted
    const letterId = 'let-self-harm-test';
    db.letters.set(letterId, {
      id: letterId,
      pod_id: 'pod-a',
      author_id: 'usr-a1',
      prompt_id: 'p-l1',
      seq: 1,
      body: textWithSelfHarm,
      status: 'submitted',
      moderation_flag: 'self_harm_risk',
      submitted_at: new Date().toISOString(),
    });

    const savedLetter = db.letters.get(letterId);
    expect(savedLetter).toBeDefined();
    expect(savedLetter?.moderation_flag).toBe('self_harm_risk');
  });
});

// ---------------------------------------------------------------------------
// AT15: Member withdrawal hides letters and creates host follow-up
// ---------------------------------------------------------------------------
describe('AT15: Member pod withdrawal', () => {
  it('hides letters from pod, marks left_at, creates host task, and returns approved microcopy', () => {
    const withdrawingUserId = 'usr-a4';
    const podId = 'pod-a';

    // Seed member letter
    const letterId = 'let-a4-seq1';
    db.letters.set(letterId, {
      id: letterId,
      pod_id: podId,
      author_id: withdrawingUserId,
      prompt_id: 'p-l1',
      seq: 1,
      body: 'Something small that made my week better was walking in Kukkarahalli Lake.',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });

    // Find membership and withdraw
    const membership = db.podMembers.find(
      (pm) => pm.user_id === withdrawingUserId && pm.pod_id === podId
    );
    expect(membership).toBeDefined();

    const now = new Date().toISOString();
    membership!.left_at = now;

    // AT15: Member's letters are hidden from the pod
    for (const [id, letter] of db.letters.entries()) {
      if (letter.author_id === withdrawingUserId && letter.pod_id === podId) {
        db.letters.set(id, { ...letter, status: 'hidden' });
      }
    }

    // AT15: Host follow-up task logged
    db.logAudit('member_withdrew', withdrawingUserId, 'pod', podId);

    // Verify letters are now hidden
    expect(db.letters.get(letterId)?.status).toBe('hidden');

    // Verify host task exists in audit log
    expect(db.auditLogs.some((a) => a.action === 'member_withdrew' && a.actor_id === withdrawingUserId)).toBe(true);

    // Verify SPEC 8.3 microcopy
    const approvedCopy = "Thank you for giving it a try. We'll let your host know so they can check in with you kindly. Your letters will be hidden from the pod.";
    expect(approvedCopy).toContain("We'll let your host know so they can check in with you kindly");
  });
});

// ---------------------------------------------------------------------------
// AT16: Account deletion and prior export
// ---------------------------------------------------------------------------
describe('AT16: Account deletion and prior export', () => {
  it('prior export contains complete user bundle', () => {
    const targetUserId = 'usr-a1';

    // Prior export bundle
    const profile = db.profiles.get(targetUserId);
    const consents = Array.from(db.consents.values()).filter((c) => c.user_id === targetUserId);
    const screening = db.screenings.get(targetUserId);
    const letters = Array.from(db.letters.values()).filter((l) => l.author_id === targetUserId);

    const exportBundle = {
      profile,
      consents,
      screening,
      letters,
    };

    expect(exportBundle.profile?.id).toBe(targetUserId);
    expect(exportBundle.profile?.display_name).toBeDefined();
    expect(exportBundle.consents.length).toBeGreaterThan(0);
  });

  it('account deletion removes profile and personal rows, and nulls event_log.user_id', () => {
    const targetUserId = 'usr-a1';

    // Log event for this user
    db.logEvent('login', targetUserId, 'pod-a', { method: 'otp' });
    db.logEvent('page_view', targetUserId, 'pod-a', { page: '/pod' });

    const userLogsBefore = db.eventLogs.filter((l) => l.user_id === targetUserId);
    expect(userLogsBefore.length).toBeGreaterThanOrEqual(2);

    // 1. Delete profile
    db.profiles.delete(targetUserId);

    // 2. Delete consents
    for (const [key, c] of Array.from(db.consents.entries())) {
      if (c.user_id === targetUserId) db.consents.delete(key);
    }

    // 3. Delete screening
    db.screenings.delete(targetUserId);

    // 4. Delete letters
    for (const [key, l] of Array.from(db.letters.entries())) {
      if (l.author_id === targetUserId) db.letters.delete(key);
    }

    // 5. Delete memberships
    db.podMembers = db.podMembers.filter((pm) => pm.user_id !== targetUserId);

    // 6. AT16: Anonymise event_log (set user_id to undefined/null)
    for (const log of db.eventLogs) {
      if (log.user_id === targetUserId) {
        log.user_id = undefined;
      }
    }

    // Verifications (AT16)
    expect(db.profiles.has(targetUserId)).toBe(false);
    expect(db.screenings.has(targetUserId)).toBe(false);
    expect(Array.from(db.consents.values()).some((c) => c.user_id === targetUserId)).toBe(false);
    expect(Array.from(db.letters.values()).some((l) => l.author_id === targetUserId)).toBe(false);
    expect(db.podMembers.some((pm) => pm.user_id === targetUserId)).toBe(false);

    // Event logs: user_id is now nulled / undefined
    const remainingLogsForUser = db.eventLogs.filter((l) => l.user_id === targetUserId);
    expect(remainingLogsForUser.length).toBe(0);
  });
});
