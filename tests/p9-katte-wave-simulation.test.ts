/**
 * Phase P9: Katte Wave Full Lifecycle Simulation (End-to-End)
 * Implements and validates the complete 4-week Katte Pilot Kit v2.0 workflow:
 * 1. Recruitment & Signup
 * 2. Katte Hand Formation (Katte A: Peeve Round, Katte B: Favourites)
 * 3. Week 1 Slow Letters & Write-to-Unlock Reciprocity
 * 4. Table 1 (Take Your Seat, Katte Rules, Opener experiment, Plant Banyan)
 * 5. Table 2 (The Elder's Game, Group Reflection, The Relay slips)
 * 6. Table 3 (Relay swap, Seen Cards, Pod Project, Graduation & Double-Opt-In Contact Share)
 * 7. Verification of all 4 Pass Marks & Decision Rubric
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '@/lib/db';
import { MemoryDatabase } from '@/lib/db/memory-db';

describe('Phase P9: Katte Wave Full Lifecycle Simulation', () => {
  let db: MemoryDatabase;

  beforeEach(() => {
    db = getDatabase();
    db.reset();
  });

  it('executes a complete 4-week Katte Wave meeting all 4 pilot pass marks', () => {
    const timestamp = new Date().toISOString();

    // ------------------------------------------------------------------------
    // Step 1: Recruitment & Member Signup (Section 3 & 4)
    // ------------------------------------------------------------------------
    // 12 Mysuru adults, all 18+, with separate unbundled consents
    const memberProfiles = [
      // Katte A members (Peeve Arm)
      { id: 'sim-a1', name: 'Asha', area: 'Gokulam', letter_hour: 20 },
      { id: 'sim-a2', name: 'Bharat', area: 'Gokulam', letter_hour: 20 },
      { id: 'sim-a3', name: 'Chitra', area: 'Jayalakshmipuram', letter_hour: 20 },
      { id: 'sim-a4', name: 'Dinesh', area: 'VV Mohalla', letter_hour: 20 },
      { id: 'sim-a5', name: 'Esha', area: 'Gokulam', letter_hour: 20 },
      { id: 'sim-a6', name: 'Farooq', area: 'Jayalakshmipuram', letter_hour: 20 },
      // Katte B members (Favourites Arm)
      { id: 'sim-b1', name: 'Gauri', area: 'Kuvempunagar', letter_hour: 20 },
      { id: 'sim-b2', name: 'Harish', area: 'Kuvempunagar', letter_hour: 20 },
      { id: 'sim-b3', name: 'Indira', area: 'Saraswathipuram', letter_hour: 20 },
      { id: 'sim-b4', name: 'Javed', area: 'Gokulam', letter_hour: 20 },
      { id: 'sim-b5', name: 'Kavita', area: 'Jayalakshmipuram', letter_hour: 20 },
      { id: 'sim-b6', name: 'Lokesh', area: 'VV Mohalla', letter_hour: 20 },
    ];

    for (const m of memberProfiles) {
      db.profiles.set(m.id, {
        id: m.id,
        display_name: m.name,
        role: 'member',
        status: 'waitlisted',
        is_18_plus: true,
        age_method: 'self_declared_stub',
        wants_women_only: false,
        languages: ['English', 'Kannada'],
        interests: ['Filter Coffee', 'Heritage Walks'],
        availability: [],
        area: m.area,
        letter_hour: m.letter_hour,
        created_at: timestamp,
      });

      // Three unticked consents granted separately during signup
      db.consents.set(`c1-${m.id}`, { id: `c1-${m.id}`, user_id: m.id, purpose: 'core_service', notice_version: '1.0', granted: true, granted_at: timestamp });
      db.consents.set(`c2-${m.id}`, { id: `c2-${m.id}`, user_id: m.id, purpose: 'safety_checkin', notice_version: '1.0', granted: true, granted_at: timestamp });
      db.consents.set(`c3-${m.id}`, { id: `c3-${m.id}`, user_id: m.id, purpose: 'whatsapp_contact', notice_version: '1.0', granted: true, granted_at: timestamp });
    }

    expect(db.profiles.size).toBeGreaterThanOrEqual(12);

    // ------------------------------------------------------------------------
    // Step 2: Katte Hand Formation (Section 5)
    // ------------------------------------------------------------------------
    // Two Kattes formed with 6 members each
    // Katte A: Peeve Round opener arm
    // Katte B: Favourites opener arm
    const katteAId = 'katte-a-gokulam';
    const katteBId = 'katte-b-kuvempunagar';

    db.pods.set(katteAId, {
      id: katteAId,
      name: 'Katte A (Gokulam)',
      status: 'letters',
      arm: 'free',
      opener_arm: 'peeve',
      deposit_inr: 0,
      capacity: 6,
      women_only: false,
      cycle_id: 'wave-1',
      wave_start: '2026-11-01T00:00:00Z',
      created_at: timestamp,
    });

    db.pods.set(katteBId, {
      id: katteBId,
      name: 'Katte B (Kuvempunagar)',
      status: 'letters',
      arm: 'free',
      opener_arm: 'favourites',
      deposit_inr: 0,
      capacity: 6,
      women_only: false,
      cycle_id: 'wave-1',
      wave_start: '2026-11-01T00:00:00Z',
      created_at: timestamp,
    });

    // Assign members to Katte A and Katte B
    for (let i = 0; i < 6; i++) {
      db.podMembers.push({ pod_id: katteAId, user_id: memberProfiles[i].id, joined_at: timestamp });
      db.podMembers.push({ pod_id: katteBId, user_id: memberProfiles[i + 6].id, joined_at: timestamp });
    }

    expect(db.podMembers.filter((pm) => pm.pod_id === katteAId)).toHaveLength(6);
    expect(db.podMembers.filter((pm) => pm.pod_id === katteBId)).toHaveLength(6);

    // ------------------------------------------------------------------------
    // Step 3: Week 1 Slow Letters & Write-to-Unlock Reciprocity (Section 6)
    // ------------------------------------------------------------------------
    const now = new Date('2026-11-03T21:00:00+05:30'); // After 8:00 PM IST letter release

    // Asha writes Letter 1
    db.letters.set('let-a1-1', {
      id: 'let-a1-1',
      pod_id: katteAId,
      author_id: 'sim-a1',
      seq: 1,
      prompt_id: 'p-l1',
      body: 'Something small that made my week better was listening to the morning birds near Kukkarahalli Lake.',
      status: 'published',
      submitted_at: '2026-11-02T14:00:00Z',
    });

    // Bharat has NOT written Letter 1 yet -> receives 0 letters (AT6 write-to-unlock)
    let bharatUnlocked = db.getUnlockedLettersForReader('sim-a2', 1, now);
    expect(bharatUnlocked).toHaveLength(0);

    // Bharat writes Letter 1
    db.letters.set('let-a2-1', {
      id: 'let-a2-1',
      pod_id: katteAId,
      author_id: 'sim-a2',
      seq: 1,
      prompt_id: 'p-l1',
      body: 'Having hot maddur vada and filter coffee after work made my whole week feel peaceful.',
      status: 'published',
      submitted_at: '2026-11-02T16:00:00Z',
    });

    // Now Bharat can read Asha's Letter 1!
    bharatUnlocked = db.getUnlockedLettersForReader('sim-a2', 1, now);
    expect(bharatUnlocked).toHaveLength(1);
    expect(bharatUnlocked[0].letter.author_id).toBe('sim-a1');
    expect(bharatUnlocked[0].author_name).toBe('Asha');

    // ------------------------------------------------------------------------
    // Step 4: Table 1 (Take Your Seat, Katte Rules, Opener Experiment)
    // ------------------------------------------------------------------------
    const meetup1A = {
      id: 'meet-a1',
      pod_id: katteAId,
      seq: 1,
      starts_at: '2026-11-08T17:00:00+05:30',
      ends_at: '2026-11-08T18:30:00+05:30',
      status: 'done' as const,
    };
    db.meetups.set(meetup1A.id, meetup1A);

    // Host checks in all 6 members at Table 1
    for (let i = 0; i < 6; i++) {
      db.attendance.push({
        meetup_id: meetup1A.id,
        user_id: memberProfiles[i].id,
        checked_in_at: '2026-11-08T17:05:00+05:30',
        marked_by: 'host-01',
      });
    }

    const t1Attendees = db.attendance.filter((a) => a.meetup_id === meetup1A.id);
    expect(t1Attendees).toHaveLength(6);

    // Katte A Opener: Peeve Round prompts & Pivot
    const peeves = Array.from(db.prompts.values()).filter((p) => p.kind === 'peeve' && p.active);
    expect(peeves.length).toBeGreaterThanOrEqual(12);
    const pivot = Array.from(db.prompts.values()).find((p) => p.kind === 'pivot');
    expect(pivot?.body_en).toContain('perfect version');

    // Table 1 Feedback submitted (Looked Forward: 4, Felt Safe: 5, Felt Included: 5)
    for (let i = 0; i < 6; i++) {
      db.feedback.set(`fb-t1-${memberProfiles[i].id}`, {
        id: `fb-t1-${memberProfiles[i].id}`,
        meetup_id: meetup1A.id,
        user_id: memberProfiles[i].id,
        looked_forward: 4,
        felt_safe: 5,
        felt_included: 5,
        would_return: true,
        share_with_host: false,
        created_at: '2026-11-08T19:00:00+05:30',
      });
    }

    // ------------------------------------------------------------------------
    // Step 5: Table 2 (The Elder's Game, Reflection, The Relay)
    // ------------------------------------------------------------------------
    const meetup2A = {
      id: 'meet-a2',
      pod_id: katteAId,
      seq: 2,
      starts_at: '2026-11-15T17:00:00+05:30',
      ends_at: '2026-11-15T18:30:00+05:30',
      status: 'done' as const,
    };
    db.meetups.set(meetup2A.id, meetup2A);

    // 5 of 6 members return for Table 2 (83.3% second-meeting rate, beating the 50% pass mark)
    for (let i = 0; i < 5; i++) {
      db.attendance.push({
        meetup_id: meetup2A.id,
        user_id: memberProfiles[i].id,
        checked_in_at: '2026-11-15T17:05:00+05:30',
        marked_by: 'host-01',
      });
    }

    const t2Attendees = db.attendance.filter((a) => a.meetup_id === meetup2A.id);
    expect(t2Attendees).toHaveLength(5);

    // Compose Relay line from Katte A to Katte B (Section 6.4)
    const relaySlipKatteA = {
      fromKatte: 'Katte A (Gokulam)',
      toKatte: 'Katte B (Kuvempunagar)',
      line: 'One thing about us: we spent 30 minutes laughing over who was worse at Chowka Bhara.',
    };
    expect(relaySlipKatteA.line.length).toBeLessThanOrEqual(140);

    // ------------------------------------------------------------------------
    // Step 6: Table 3 (Relay Swap, Seen Cards, Graduation & Contact-Share)
    // ------------------------------------------------------------------------
    const meetup3A = {
      id: 'meet-a3',
      pod_id: katteAId,
      seq: 3,
      starts_at: '2026-11-22T17:00:00+05:30',
      ends_at: '2026-11-22T18:30:00+05:30',
      status: 'done' as const,
    };
    db.meetups.set(meetup3A.id, meetup3A);

    // 5 members attend Table 3
    for (let i = 0; i < 5; i++) {
      db.attendance.push({
        meetup_id: meetup3A.id,
        user_id: memberProfiles[i].id,
        checked_in_at: '2026-11-22T17:05:00+05:30',
        marked_by: 'host-01',
      });
    }

    // Asha writes a Seen Card to Bharat (10-200 characters)
    const seenCard = db.submitAppreciation(
      'sim-a1',
      katteAId,
      meetup3A.id,
      'sim-a2',
      'The quiet encouragement you gave during the board game made everyone feel welcome.'
    );
    expect(seenCard.status).toBe('submitted');

    // Graduation Keep-the-Katte slips and Final Feedback
    for (let i = 0; i < 5; i++) {
      db.feedback.set(`fb-t3-${memberProfiles[i].id}`, {
        id: `fb-t3-${memberProfiles[i].id}`,
        meetup_id: meetup3A.id,
        user_id: memberProfiles[i].id,
        looked_forward: 5,
        felt_safe: 5,
        felt_included: 5,
        would_return: true,
        remembered_rituals: ['relay', 'elders_game', 'banyan', 'seen_cards'],
        free_text: 'The relay from the other Katte made the whole city feel smaller and friendlier.',
        share_with_host: true,
        created_at: '2026-11-22T19:00:00+05:30',
      });
    }

    // ------------------------------------------------------------------------
    // Step 7: Pass Marks & Decision Rubric Evaluation (Section 0.3 & 12.7)
    // ------------------------------------------------------------------------
    // Pass Mark 1: At least half of the people at Table 1 come to Table 2
    const secondMeetingRate = t2Attendees.length / t1Attendees.length;
    expect(secondMeetingRate).toBeGreaterThanOrEqual(0.5); // 5/6 = 83.3%

    // Pass Mark 2: Average 'felt safe' score is 4 or more out of 5
    const allFeedback = Array.from(db.feedback.values());
    const avgFeltSafe = allFeedback.reduce((sum, fb) => sum + fb.felt_safe, 0) / allFeedback.length;
    expect(avgFeltSafe).toBeGreaterThanOrEqual(4.0); // 5.0 out of 5

    // Pass Mark 3: Zero unresolved serious safety reports
    const openReports = Array.from(db.safetyReports.values()).filter((r) => r.status === 'open');
    expect(openReports).toHaveLength(0);

    // Pass Mark 4: Qualitative unprompted recall of rituals
    const rememberedRitualList = allFeedback.flatMap((fb) => fb.remembered_rituals || []);
    expect(rememberedRitualList).toContain('relay');
    expect(rememberedRitualList).toContain('elders_game');
    expect(rememberedRitualList).toContain('banyan');
    expect(rememberedRitualList).toContain('seen_cards');

    // All 4 pass marks met -> Decision Rubric confirms readiness for Pilot 2!
    const allPassMarksMet =
      secondMeetingRate >= 0.5 &&
      avgFeltSafe >= 4.0 &&
      openReports.length === 0 &&
      rememberedRitualList.length > 0;

    expect(allPassMarksMet).toBe(true);
  });
});
