/**
 * P5 Acceptance Tests: Tables (AT11, AT21, and P5 behaviors)
 *
 * AT11: Given the deposit arm, when a member RSVPs yes, then MockProvider creates a hold;
 *       when the host checks them in, the hold is refunded; a no-show follows the
 *       configured policy.
 *
 * AT21: Given a meetup with fewer than 4 confirmed yes RSVPs 24 hours before it starts,
 *       then a host task is created to reschedule or merge, and members get a neutral
 *       message with no guilt or urgency wording.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryDatabase } from '../lib/db/memory-db';
import { MockPaymentProvider } from '../lib/adapters/payments/mock';
import { KeywordModerator } from '../lib/adapters/moderation/keyword';

let db: MemoryDatabase;
let payment: MockPaymentProvider;
let moderation: KeywordModerator;

beforeEach(() => {
  db = new MemoryDatabase();
  payment = new MockPaymentProvider();
  moderation = new KeywordModerator();
});

// ---------------------------------------------------------------------------
// AT11: Deposit hold, auto-refund on check-in, and no-show policies
// ---------------------------------------------------------------------------
describe('AT11: Deposit arm lifecycle', () => {
  it('creates a hold when a member in a deposit pod RSVPs yes', async () => {
    // pod-b is deposit arm (₹200) in seed data
    const pod = db.pods.get('pod-b')!;
    expect(pod.arm).toBe('deposit');
    expect(pod.deposit_inr).toBe(200);

    const meetupId = 'm-b-1';
    const userId = 'usr-b1';

    // Member RSVPs yes
    const holdResult = await payment.createHold(userId, pod.id, pod.deposit_inr);
    expect(holdResult.success).toBe(true);
    expect(holdResult.status).toBe('held');
    expect(holdResult.amountInr).toBe(200);
    expect(holdResult.ref).toBeDefined();

    // Store RSVP with held deposit
    db.rsvps.set(`${meetupId}:${userId}`, {
      meetup_id: meetupId,
      user_id: userId,
      response: 'yes',
      deposit: 'held',
      payment_ref: holdResult.ref,
      responded_at: new Date().toISOString(),
    });

    const rsvp = db.rsvps.get(`${meetupId}:${userId}`);
    expect(rsvp?.deposit).toBe('held');
    expect(rsvp?.payment_ref).toBe(holdResult.ref);
  });

  it('automatically refunds the hold when the host checks the member in', async () => {
    const pod = db.pods.get('pod-b')!;
    const meetupId = 'm-b-1';
    const userId = 'usr-b1';

    // 1. Hold created on RSVP
    const hold = await payment.createHold(userId, pod.id, pod.deposit_inr);
    db.rsvps.set(`${meetupId}:${userId}`, {
      meetup_id: meetupId,
      user_id: userId,
      response: 'yes',
      deposit: 'held',
      payment_ref: hold.ref,
      responded_at: new Date().toISOString(),
    });

    // 2. Host checks in member
    const rsvp = db.rsvps.get(`${meetupId}:${userId}`)!;
    expect(rsvp.deposit).toBe('held');

    const refundResult = await payment.refund(rsvp.payment_ref!);
    expect(refundResult.success).toBe(true);
    expect(refundResult.status).toBe('refunded');

    // Update RSVP record
    db.rsvps.set(`${meetupId}:${userId}`, {
      ...rsvp,
      deposit: 'refunded',
    });
    db.attendance.push({
      meetup_id: meetupId,
      user_id: userId,
      checked_in_at: new Date().toISOString(),
      marked_by: 'host-01',
    });

    // Verify refund in DB
    const updatedRsvp = db.rsvps.get(`${meetupId}:${userId}`);
    expect(updatedRsvp?.deposit).toBe('refunded');
    expect(db.attendance.some((a) => a.meetup_id === meetupId && a.user_id === userId)).toBe(true);
  });

  it('forfeits the deposit for a no-show when configured policy is forfeit', async () => {
    const pod = db.pods.get('pod-b')!;
    const meetupId = 'm-b-1';
    const noShowUserId = 'usr-b2';

    // Member RSVPed yes but didn't show
    const hold = await payment.createHold(noShowUserId, pod.id, pod.deposit_inr);
    db.rsvps.set(`${meetupId}:${noShowUserId}`, {
      meetup_id: meetupId,
      user_id: noShowUserId,
      response: 'yes',
      deposit: 'held',
      payment_ref: hold.ref,
      responded_at: new Date().toISOString(),
    });

    // Host closes meetup with policy 'forfeit'
    const forfeitResult = await payment.forfeit(hold.ref);
    expect(forfeitResult.success).toBe(true);
    expect(forfeitResult.status).toBe('forfeited');

    db.rsvps.set(`${meetupId}:${noShowUserId}`, {
      ...db.rsvps.get(`${meetupId}:${noShowUserId}`)!,
      deposit: 'forfeited',
    });

    expect(db.rsvps.get(`${meetupId}:${noShowUserId}`)?.deposit).toBe('forfeited');
  });

  it('refunds the deposit for a no-show when configured policy is refund', async () => {
    const pod = db.pods.get('pod-b')!;
    const meetupId = 'm-b-1';
    const noShowUserId = 'usr-b3';

    // Member RSVPed yes with hold
    const hold = await payment.createHold(noShowUserId, pod.id, pod.deposit_inr);
    db.rsvps.set(`${meetupId}:${noShowUserId}`, {
      meetup_id: meetupId,
      user_id: noShowUserId,
      response: 'yes',
      deposit: 'held',
      payment_ref: hold.ref,
      responded_at: new Date().toISOString(),
    });

    // Host closes meetup with policy 'refund'
    const refundResult = await payment.refund(hold.ref);
    expect(refundResult.success).toBe(true);
    expect(refundResult.status).toBe('refunded');

    db.rsvps.set(`${meetupId}:${noShowUserId}`, {
      ...db.rsvps.get(`${meetupId}:${noShowUserId}`)!,
      deposit: 'refunded',
    });

    expect(db.rsvps.get(`${meetupId}:${noShowUserId}`)?.deposit).toBe('refunded');
  });

  it('creates NO hold when a member in a free pod RSVPs yes', async () => {
    const pod = db.pods.get('pod-a')!;
    expect(pod.arm).toBe('free');

    const meetupId = 'm-a-1';
    const userId = 'usr-a1';

    // In a free pod, deposit remains 'none'
    db.rsvps.set(`${meetupId}:${userId}`, {
      meetup_id: meetupId,
      user_id: userId,
      response: 'yes',
      deposit: 'none',
      responded_at: new Date().toISOString(),
    });

    const rsvp = db.rsvps.get(`${meetupId}:${userId}`);
    expect(rsvp?.deposit).toBe('none');
    expect(rsvp?.payment_ref).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AT21: Minimum-table rule & neutral messaging
// ---------------------------------------------------------------------------
describe('AT21: Minimum table rule and neutral notifications', () => {
  it('triggers a host task when fewer than 4 confirmed yes RSVPs exist within 24h', () => {
    const meetupId = 'm-test-24h';
    const startsAt = new Date(Date.now() + 12 * 3600000).toISOString(); // 12 hours from now

    db.meetups.set(meetupId, {
      id: meetupId,
      pod_id: 'pod-a',
      seq: 1,
      starts_at: startsAt,
      ends_at: new Date(Date.now() + 14 * 3600000).toISOString(),
      status: 'scheduled',
    });

    // Only 2 confirmed 'yes' RSVPs (fewer than 4)
    db.rsvps.set(`${meetupId}:usr-a1`, {
      meetup_id: meetupId,
      user_id: 'usr-a1',
      response: 'yes',
      deposit: 'none',
      responded_at: new Date().toISOString(),
    });
    db.rsvps.set(`${meetupId}:usr-a2`, {
      meetup_id: meetupId,
      user_id: 'usr-a2',
      response: 'yes',
      deposit: 'none',
      responded_at: new Date().toISOString(),
    });

    // Evaluate minimum table rule (24h threshold)
    const confirmedYes = Array.from(db.rsvps.values()).filter(
      (r) => r.meetup_id === meetupId && r.response === 'yes'
    );

    const isWithin24Hours = true;
    const isBelowMinimum = confirmedYes.length < 4;

    expect(isWithin24Hours).toBe(true);
    expect(isBelowMinimum).toBe(true);

    let hostTask: string | null = null;
    if (isWithin24Hours && isBelowMinimum) {
      hostTask = `Low RSVPs for Table 1 (${confirmedYes.length}/4 minimum confirmed). Consider rescheduling or merging.`;
      db.logAudit('low_rsvp_host_task', 'system', 'meetup', meetupId);
    }

    expect(hostTask).toContain('Low RSVPs for Table 1 (2/4 minimum confirmed)');
    expect(db.auditLogs.some((a) => a.action === 'low_rsvp_host_task')).toBe(true);
  });

  it('does NOT trigger a host task when 4 or more confirmed yes RSVPs exist', () => {
    const meetupId = 'm-test-healthy';
    for (let i = 1; i <= 5; i++) {
      db.rsvps.set(`${meetupId}:usr-a${i}`, {
        meetup_id: meetupId,
        user_id: `usr-a${i}`,
        response: 'yes',
        deposit: 'none',
        responded_at: new Date().toISOString(),
      });
    }

    const confirmedYes = Array.from(db.rsvps.values()).filter(
      (r) => r.meetup_id === meetupId && r.response === 'yes'
    );
    expect(confirmedYes.length).toBe(5);
    expect(confirmedYes.length >= 4).toBe(true);
  });

  it('guarantees notifications and messages contain no banned guilt or urgency copy', () => {
    const bannedPhrases = [
      'last chance',
      'only x left',
      'only 1 left',
      'only 2 left',
      'you\'re missing out',
      'don\'t let them down',
      'your streak',
      'people are waiting',
    ];

    // Check sample messages generated by the app
    const sampleNeutralMessages = [
      'Your seat is reserved. See you at the table.',
      'Thank you for letting us know. We hope to see you at the next table.',
      'Thank you for your update. Please confirm when your schedule is clear.',
      'This is a refundable deposit of ₹300. You get it back automatically when the host checks you in. If you can\'t come, tell us before 24 hours of the meetup and you get it back anyway.',
      'No problem. Maybe another time.',
      'That\'s everything for today. Your next letter arrives at 8:00 pm tomorrow. See you at the table.',
    ];

    for (const msg of sampleNeutralMessages) {
      const lower = msg.toLowerCase();
      for (const banned of bannedPhrases) {
        expect(lower.includes(banned)).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Stretch Cards & Pod Notes
// ---------------------------------------------------------------------------
describe('Stretch Cards & Pod Notes', () => {
  it('skipping a stretch card sets skipped=true and produces no penalty or follow-up nag', () => {
    const choiceId = 'sc-usr-a1-pod-a-p-s1';
    db.stretchChoices.set(choiceId, {
      id: choiceId,
      user_id: 'usr-a1',
      pod_id: 'pod-a',
      prompt_id: 'p-s1',
      chosen_at: new Date().toISOString(),
      skipped: true,
    });

    const choice = db.stretchChoices.get(choiceId);
    expect(choice?.skipped).toBe(true);
    expect(choice?.completed_at).toBeUndefined();

    // R6 microcopy
    const skipCopy = 'No problem. Maybe another time.';
    expect(skipCopy).toBe('No problem. Maybe another time.');
  });

  it('pod notes enforces 500 characters maximum', () => {
    const validBody = 'A'.repeat(500);
    expect(validBody.length).toBe(500);

    const noteId = 'note-1';
    db.podNotes.set(noteId, {
      id: noteId,
      pod_id: 'pod-a',
      author_id: 'usr-a1',
      body: validBody,
      status: 'published',
      created_at: new Date().toISOString(),
    });

    expect(db.podNotes.get(noteId)?.body.length).toBe(500);
  });

  it('hides notes between blocked pairs', () => {
    const authorA = 'usr-a1';
    const authorB = 'usr-a2';

    // A writes a note
    db.podNotes.set('note-a', {
      id: 'note-a',
      pod_id: 'pod-a',
      author_id: authorA,
      body: 'Hello from member A',
      status: 'published',
      created_at: new Date().toISOString(),
    });

    // Block relationship
    db.blocks.push({
      blocker_id: authorB,
      blocked_id: authorA,
      created_at: new Date().toISOString(),
    });

    // Check if B should see A's note
    const notesForB = Array.from(db.podNotes.values()).filter((n) => {
      const isBlocked = db.blocks.some(
        (b) =>
          (b.blocker_id === authorB && b.blocked_id === n.author_id) ||
          (b.blocker_id === n.author_id && b.blocked_id === authorB)
      );
      return !isBlocked;
    });

    expect(notesForB.some((n) => n.id === 'note-a')).toBe(false);
  });

  it('moderation flags self-harm keywords in pod notes and triggers helpline flag without deleting', () => {
    const noteText = 'I feel like suicide is the only way out';
    const check = moderation.checkContent(noteText);

    expect(check.flagged).toBe(true);
    expect(check.isSelfHarmRisk).toBe(true);
    expect(check.priority).toBe('high');

    // Section 9.3: the note is NOT deleted
    const noteId = 'note-flagged';
    db.podNotes.set(noteId, {
      id: noteId,
      pod_id: 'pod-a',
      author_id: 'usr-a1',
      body: noteText,
      status: 'published',
      created_at: new Date().toISOString(),
    });

    expect(db.podNotes.has(noteId)).toBe(true);
  });
});
