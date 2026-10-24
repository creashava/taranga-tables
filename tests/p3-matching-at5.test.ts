import { describe, it, expect, beforeEach } from 'vitest';
import { runMatchingAlgorithm, MatchCandidate } from '@/lib/matching';
import { getDatabase } from '@/lib/db';
import { POST as createPodRoute } from '@/app/api/host/pods/route';
import { POST as moveMemberRoute } from '@/app/api/host/move-member/route';
import { NextRequest } from 'next/server';

function createJsonRequest(url: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function generateCandidate(
  id: string,
  displayName: string,
  overrides: Partial<MatchCandidate> = {}
): MatchCandidate {
  return {
    id,
    displayName,
    is18Plus: true,
    status: 'waitlisted',
    screeningBand: 'none',
    hostFollowupDone: false,
    wantsWomenOnly: false,
    gender: 'prefer_not_to_say',
    languages: ['English', 'Kannada'],
    interests: ['Filter Coffee', 'Books'],
    talkVsListen: 3,
    plannedVsSpontaneous: 3,
    availability: [
      { dow: 6, part: 'evening' },
      { dow: 0, part: 'evening' },
    ],
    area: 'Gokulam',
    blockedUserIds: [],
    waitingSince: '2026-10-15T10:00:00Z',
    ...overrides,
  };
}

describe('Phase P3: Host Console and Matching Algorithm (AT5)', () => {
  const db = getDatabase();

  beforeEach(() => {
    db.reset();
  });

  describe('AT5: Matching Hard Constraints', () => {
    it('never places women-only requesters in mixed pods', () => {
      // 6 candidates wanting women-only + 6 candidates wanting mixed
      const womenOnlyCandidates = Array.from({ length: 6 }, (_, i) =>
        generateCandidate(`w-${i + 1}`, `Woman-${i + 1}`, {
          wantsWomenOnly: true,
          gender: 'female',
        })
      );

      const mixedCandidates = Array.from({ length: 6 }, (_, i) =>
        generateCandidate(`m-${i + 1}`, `Mixed-${i + 1}`, {
          wantsWomenOnly: false,
          gender: i % 2 === 0 ? 'male' : 'female',
        })
      );

      const pool = [...womenOnlyCandidates, ...mixedCandidates];
      const result = runMatchingAlgorithm(pool);

      expect(result.suggestedPods.length).toBeGreaterThanOrEqual(1);

      // Verify that every pod containing a women-only requester contains ONLY women-only requesters
      result.suggestedPods.forEach((pod) => {
        const hasWomenOnlyRequester = pod.members.some((m) => m.wantsWomenOnly);
        if (hasWomenOnlyRequester) {
          expect(pod.isWomenOnly).toBe(true);
          pod.members.forEach((m) => {
            expect(m.wantsWomenOnly).toBe(true);
          });
        } else {
          expect(pod.isWomenOnly).toBe(false);
          pod.members.forEach((m) => {
            expect(m.wantsWomenOnly).toBe(false);
          });
        }
      });
    });

    it('ensures no mixed pod has exactly one woman', () => {
      // 5 male candidates + 1 female candidate (only 1 woman in the candidate group)
      const maleCandidates = Array.from({ length: 5 }, (_, i) =>
        generateCandidate(`man-${i + 1}`, `Man-${i + 1}`, {
          wantsWomenOnly: false,
          gender: 'male',
        })
      );

      const singleWomanCandidate = generateCandidate('lone-woman', 'Lone Woman', {
        wantsWomenOnly: false,
        gender: 'female',
      });

      // Try forming a pod with this group
      const pool = [...maleCandidates, singleWomanCandidate];
      const result = runMatchingAlgorithm(pool);

      // A pod with exactly 1 woman must NOT be suggested (must have >=2 or 0 women)
      result.suggestedPods.forEach((pod) => {
        if (!pod.isWomenOnly) {
          const womanCount = pod.members.filter(
            (m) => m.gender?.toLowerCase() === 'female' || m.gender?.toLowerCase() === 'woman'
          ).length;
          expect(womanCount).not.toBe(1);
        }
      });
    });

    it('never places blocked pairs together in the same pod', () => {
      // Candidate A and Candidate B have blocked each other
      const candidateA = generateCandidate('blocked-a', 'User A', {
        blockedUserIds: ['blocked-b'],
      });
      const candidateB = generateCandidate('blocked-b', 'User B', {
        blockedUserIds: ['blocked-a'],
      });

      const neutralCandidates = Array.from({ length: 10 }, (_, i) =>
        generateCandidate(`neut-${i + 1}`, `Neutral-${i + 1}`)
      );

      const pool = [candidateA, candidateB, ...neutralCandidates];
      const result = runMatchingAlgorithm(pool);

      // Assert that Candidate A and Candidate B are NEVER in the same pod
      result.suggestedPods.forEach((pod) => {
        const hasA = pod.members.some((m) => m.id === 'blocked-a');
        const hasB = pod.members.some((m) => m.id === 'blocked-b');
        expect(hasA && hasB).toBe(false);
      });
    });

    it('ensures every suggested pod has between 5 and 7 people', () => {
      const candidates = Array.from({ length: 13 }, (_, i) =>
        generateCandidate(`usr-${i + 1}`, `Member-${i + 1}`)
      );

      const result = runMatchingAlgorithm(candidates);
      expect(result.suggestedPods.length).toBeGreaterThanOrEqual(1);

      result.suggestedPods.forEach((pod) => {
        expect(pod.members.length).toBeGreaterThanOrEqual(5);
        expect(pod.members.length).toBeLessThanOrEqual(7);
      });
    });

    it('generates a plain-language explanation for why these people were matched', () => {
      const candidates = Array.from({ length: 6 }, (_, i) =>
        generateCandidate(`expl-${i + 1}`, `Expl-${i + 1}`, {
          interests: ['Filter Coffee', 'Architecture'],
          languages: ['Kannada', 'English'],
          availability: [
            { dow: 6, part: 'evening' },
            { dow: 0, part: 'evening' },
          ],
        })
      );

      const result = runMatchingAlgorithm(candidates);
      expect(result.suggestedPods.length).toBe(1);

      const pod = result.suggestedPods[0];
      expect(pod.explanation).toBeDefined();
      expect(pod.explanation).toContain('Matched on shared');
      expect(pod.explanation).toContain('evenings');
    });
  });

  describe('Host Approval and Removal Workflow', () => {
    it('writes to audit_log when a host confirms a pod', async () => {
      const members = Array.from({ length: 6 }, (_, i) => `member-test-${i + 1}`);

      members.forEach((id) => {
        db.profiles.set(id, {
          id,
          display_name: `Test-${id}`,
          role: 'member',
          status: 'waitlisted',
          is_18_plus: true,
          wants_women_only: false,
          languages: ['English'],
          interests: ['Coffee'],
          availability: [{ dow: 6, part: 'evening' }],
          area: 'Gokulam',
          letter_hour: 20,
          created_at: new Date().toISOString(),
        });
      });

      const req = createJsonRequest('http://localhost:3000/api/host/pods', {
        name: 'New Mysore Pod',
        arm: 'deposit',
        depositInr: 200,
        womenOnly: false,
        memberIds: members,
      });

      const res = await createPodRoute(req);
      expect(res.status).toBe(200);

      const auditEntries = db.auditLogs.filter((a) => a.action === 'host_confirm_pod');
      expect(auditEntries.length).toBeGreaterThanOrEqual(1);
    });

    it('writes to audit_log when a host removes a member with a reason', async () => {
      // Put a member in pod-a
      const memberId = 'usr-a1';
      const podId = 'pod-a';

      const req = createJsonRequest('http://localhost:3000/api/host/move-member', {
        userId: memberId,
        podId,
        action: 'remove',
        reason: 'Requested date change due to work travel',
      });

      const res = await moveMemberRoute(req);
      expect(res.status).toBe(200);

      // Verify audit log has the removal and the specified reason
      const auditEntries = db.auditLogs.filter((a) => a.action.includes('host_remove_member'));
      expect(auditEntries.length).toBeGreaterThanOrEqual(1);
      expect(auditEntries[0].action).toContain('Requested date change');
    });
  });
});
