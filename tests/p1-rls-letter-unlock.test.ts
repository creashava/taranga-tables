import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase, calculateRevealTime } from '@/lib/db';

describe('Phase P1: Database, RLS Isolation, and Letter Unlock Rules', () => {
  const db = getDatabase();

  beforeEach(() => {
    db.reset();
  });

  describe('AT10: Pod Member Profile Isolation', () => {
    it('allows a member to read only display_name for other pod members, and nothing outside their pod', () => {
      // Member A in Pod A
      const memberAId = 'usr-a1';
      const visibleMembers = db.getPodMembersVisibleForMember(memberAId);

      // Should return exactly the 6 members of Pod A
      expect(visibleMembers).toHaveLength(6);

      // Verify each item exposes ONLY pod_id, user_id, and display_name (no phone, DOB, location, or private answers)
      visibleMembers.forEach((m) => {
        expect(m.pod_id).toBe('pod-a');
        expect(m.display_name).toBeDefined();
        // Check that private fields are NOT present
        expect((m as any).phone).toBeUndefined();
        expect((m as any).dob).toBeUndefined();
        expect((m as any).interests).toBeUndefined();
        expect((m as any).availability).toBeUndefined();
      });

      // Assert that NO members from Pod B are visible
      const podBUserIds = ['usr-b1', 'usr-b2', 'usr-b3', 'usr-b4', 'usr-b5', 'usr-b6'];
      podBUserIds.forEach((bId) => {
        expect(visibleMembers.some((m) => m.user_id === bId)).toBe(false);
      });
    });
  });

  describe('AT6: Write-to-Unlock Reciprocity (Member B has not submitted)', () => {
    it("returns zero rows for B when B has not submitted letter 1, even if A submitted letter 1", () => {
      const memberAId = 'usr-a1';
      const memberBId = 'usr-a2';

      // Member A submits letter seq 1
      db.letters.set('let-a1', {
        id: 'let-a1',
        pod_id: 'pod-a',
        author_id: memberAId,
        prompt_id: 'p-l1',
        seq: 1,
        body: 'This is member A writing about a small thing that made this week better.',
        status: 'submitted',
        submitted_at: '2026-11-02T10:00:00+05:30',
      });

      // Member B has NOT submitted letter 1 yet.
      // Query as Member B for seq 1:
      const unlockedForB = db.getUnlockedLettersForReader(memberBId, 1, new Date('2026-11-02T21:00:00+05:30'));
      expect(unlockedForB).toHaveLength(0);

      // Member A can always see their own letter (R4)
      const ownLettersA = db.getOwnLetters(memberAId);
      expect(ownLettersA).toHaveLength(1);
      expect(ownLettersA[0].id).toBe('let-a1');
    });
  });

  describe('AT7: Reveal Timing (Asia/Kolkata)', () => {
    it('makes letter 1 visible at 8:00 pm (letter_hour 20) and NOT earlier', () => {
      const memberAId = 'usr-a1';
      const memberBId = 'usr-a2'; // letter_hour = 20

      // Member A submitted at 10:00 AM on 2026-11-02
      db.letters.set('let-a1', {
        id: 'let-a1',
        pod_id: 'pod-a',
        author_id: memberAId,
        prompt_id: 'p-l1',
        seq: 1,
        body: 'A small moment of quiet in Mysore palace gardens this morning.',
        status: 'submitted',
        submitted_at: '2026-11-02T10:00:00+05:30',
      });

      // Member B submits letter 1 at 3:00 PM (15:00) on 2026-11-02
      db.letters.set('let-b1', {
        id: 'let-b1',
        pod_id: 'pod-a',
        author_id: memberBId,
        prompt_id: 'p-l1',
        seq: 1,
        body: 'Walked through Chamundi foothills and found a peaceful spot.',
        status: 'submitted',
        submitted_at: '2026-11-02T15:00:00+05:30',
      });

      // 1. Check at 7:59 PM (19:59) same day -> MUST NOT be visible yet
      const at759PM = new Date('2026-11-02T19:59:59+05:30');
      const unlockedBeforeTime = db.getUnlockedLettersForReader(memberBId, 1, at759PM);
      expect(unlockedBeforeTime).toHaveLength(0);

      // 2. Check at 8:00 PM (20:00) same day -> MUST BE VISIBLE
      const at800PM = new Date('2026-11-02T20:00:00+05:30');
      const unlockedAt8PM = db.getUnlockedLettersForReader(memberBId, 1, at800PM);
      expect(unlockedAt8PM).toHaveLength(1);
      expect(unlockedAt8PM[0].letter.id).toBe('let-a1');
      expect(unlockedAt8PM[0].author_name).toBe('Aarav-Fake');
    });

    it('calculates reveal time on the next day if submitted after letter_hour', () => {
      // Both submit at 21:30 (9:30 PM) on Nov 2nd with letter_hour 20
      const aSubmitted = '2026-11-02T21:30:00+05:30';
      const bSubmitted = '2026-11-02T21:45:00+05:30';
      const revealTime = calculateRevealTime(aSubmitted, bSubmitted, 20);

      // Reveal time must be Nov 3rd at 20:00 (8:00 PM) IST
      // 2026-11-03 20:00:00 IST is UTC 14:30:00
      expect(revealTime.toISOString()).toBe(new Date('2026-11-03T20:00:00+05:30').toISOString());
    });
  });

  describe('Blocking Isolation (Section 5.1 & AT13 preview)', () => {
    it('hides letters from blocked members in both directions', () => {
      const memberAId = 'usr-a1';
      const memberBId = 'usr-a2';

      // Both submitted letters
      db.letters.set('let-a1', {
        id: 'let-a1',
        pod_id: 'pod-a',
        author_id: memberAId,
        prompt_id: 'p-l1',
        seq: 1,
        body: 'A test letter from author A.',
        status: 'submitted',
        submitted_at: '2026-11-02T10:00:00+05:30',
      });
      db.letters.set('let-b1', {
        id: 'let-b1',
        pod_id: 'pod-a',
        author_id: memberBId,
        prompt_id: 'p-l1',
        seq: 1,
        body: 'A test letter from author B.',
        status: 'submitted',
        submitted_at: '2026-11-02T11:00:00+05:30',
      });

      // Member B blocks Member A
      db.blocks.push({
        blocker_id: memberBId,
        blocked_id: memberAId,
        created_at: new Date().toISOString(),
      });

      // At 21:00 (after reveal time)
      const afterReveal = new Date('2026-11-02T21:00:00+05:30');

      // Neither A nor B should see each other's letters
      expect(db.getUnlockedLettersForReader(memberBId, 1, afterReveal)).toHaveLength(0);
      expect(db.getUnlockedLettersForReader(memberAId, 1, afterReveal)).toHaveLength(0);
    });
  });
});
