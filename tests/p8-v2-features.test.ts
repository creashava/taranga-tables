/**
 * Phase P8 Acceptance Tests
 * AT: Opener cards, Seen Cards, Events funnel (M13, M14, M16, M18, H10, N17, N18)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryDatabase } from '../lib/db/memory-db';

let db: MemoryDatabase;

beforeEach(() => {
  db = new MemoryDatabase();
});

describe('P8 Phase: v2.0 Entities & Logic', () => {

  describe('Opener Cards (M13)', () => {
    it('pod-a uses peeve opener arm', () => {
      const pod = db.pods.get('pod-a');
      expect(pod?.opener_arm).toBe('peeve');
    });

    it('pod-b uses favourites opener arm', () => {
      const pod = db.pods.get('pod-b');
      expect(pod?.opener_arm).toBe('favourites');
    });

    it('seeded peeve prompts are present', () => {
      const peeves = Array.from(db.prompts.values()).filter((p) => p.kind === 'peeve' && p.active);
      expect(peeves.length).toBeGreaterThanOrEqual(3);
    });

    it('pivot prompt is seeded', () => {
      const pivot = Array.from(db.prompts.values()).find((p) => p.kind === 'pivot' && p.active);
      expect(pivot).toBeDefined();
      expect(pivot?.body_en).toContain('perfect version');
    });

    it('favourite prompts are seeded', () => {
      const favs = Array.from(db.prompts.values()).filter((p) => p.kind === 'favourite' && p.active);
      expect(favs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Seen Cards (M14, Appreciations)', () => {
    it('rejects self-appreciation', () => {
      expect(() => {
        db.submitAppreciation('usr-a1', 'pod-a', 'm-a1', 'usr-a1', 'Great job to myself!');
      }).toThrow('Cannot write a Seen card to yourself');
    });

    it('rejects body shorter than 10 chars', () => {
      expect(() => {
        db.submitAppreciation('usr-a1', 'pod-a', 'm-a1', 'usr-a2', 'Short');
      }).toThrow('between 10 and 200 characters');
    });

    it('rejects body longer than 200 chars', () => {
      const longBody = 'a'.repeat(201);
      expect(() => {
        db.submitAppreciation('usr-a1', 'pod-a', 'm-a1', 'usr-a2', longBody);
      }).toThrow('between 10 and 200 characters');
    });

    it('accepts a valid seen card (10-200 chars)', () => {
      const apprec = db.submitAppreciation(
        'usr-a1', 'pod-a', 'm-a1', 'usr-a2',
        'The way you listened during the stretch was really noticeable.'
      );
      expect(apprec.id).toBeDefined();
      expect(apprec.status).toBe('submitted');
    });

    it('prevents duplicate appreciation for same meetup + author + recipient', () => {
      db.submitAppreciation('usr-a1', 'pod-a', 'm-a1', 'usr-a2', 'You really listened closely.');
      expect(() => {
        db.submitAppreciation('usr-a1', 'pod-a', 'm-a1', 'usr-a2', 'Another note.');
      }).toThrow('already submitted');
    });

    it('seen card is not readable before recipient letter hour', () => {
      const meetup = db.meetups.get('m-a1');
      if (!meetup) return;

      // Set meetup ends at future time (not yet readable)
      const futureMeetup = { ...meetup, ends_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString() };
      db.meetups.set('m-a1', futureMeetup);

      db.submitAppreciation('usr-a1', 'pod-a', 'm-a1', 'usr-a2', 'You were very present today.');
      const received = db.getReceivedAppreciations('usr-a2', new Date());
      expect(received).toHaveLength(0);
    });

    it('seen card is readable after recipient letter hour following meetup', () => {
      const pastTime = new Date(Date.now() - 26 * 3600 * 1000).toISOString();
      const meetup = db.meetups.get('m-a1');
      if (!meetup) return;

      db.meetups.set('m-a1', { ...meetup, ends_at: pastTime });
      db.submitAppreciation('usr-a1', 'pod-a', 'm-a1', 'usr-a2', 'You were very present today.');

      const farFuture = new Date(Date.now() + 48 * 3600 * 1000);
      const received = db.getReceivedAppreciations('usr-a2', farFuture);
      expect(received).toHaveLength(1);
    });
  });

  describe('Taranga Events Funnel (M18, N18)', () => {
    it('canSeeEvents returns false for active pod member', () => {
      // usr-a1 is in pod-a which has status: letters
      expect(db.canSeeEvents('usr-a1')).toBe(false);
    });

    it('canSeeEvents returns true for closing pod member', () => {
      // usr-closing is in pod-closing which has status: closing
      expect(db.canSeeEvents('usr-closing')).toBe(true);
    });

    it('canSeeEvents returns true for host', () => {
      expect(db.canSeeEvents('host-01')).toBe(true);
    });

    it('getPublishedEvents returns empty for ineligible user', () => {
      const events = db.getPublishedEvents('usr-a1');
      expect(events).toHaveLength(0);
    });

    it('getPublishedEvents returns max 2 events for eligible user (N18 calm card)', () => {
      const events = db.getPublishedEvents('usr-closing');
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.length).toBeLessThanOrEqual(2);
    });

    it('seeded events have no urgency wording', () => {
      const events = Array.from(db.tarangaEvents.values());
      expect(events.length).toBeGreaterThan(0);
      events.forEach((e) => {
        const text = `${e.title} ${e.blurb}`.toLowerCase();
        expect(text).not.toContain('last chance');
        expect(text).not.toContain('only');
        expect(text).not.toContain('hurry');
        expect(text).not.toContain('limited');
        expect(text).not.toContain("don't miss");
      });
    });

    it('recordEventInterest stores interest correctly', () => {
      db.recordEventInterest('usr-closing', 'te-01');
      const interest = db.eventInterests.get('te-01_usr-closing');
      expect(interest).toBeDefined();
      expect(interest?.user_id).toBe('usr-closing');
    });

    it('mark attendance records attended_at', () => {
      db.recordEventInterest('usr-closing', 'te-01');
      db.recordEventAttendance('host-01', 'usr-closing', 'te-01');
      const interest = db.eventInterests.get('te-01_usr-closing');
      expect(interest?.attended_at).toBeDefined();
      expect(interest?.marked_by).toBe('host-01');
    });
  });

  describe('Waypoints and Bounties (M16, N17)', () => {
    it('seeded waypoints are public and verified', () => {
      const waypoints = Array.from(db.waypoints.values());
      expect(waypoints.length).toBeGreaterThanOrEqual(2);
      waypoints.filter((w) => w.active).forEach((w) => {
        expect(w.is_public).toBe(true);
        expect(w.staffed || w.host_attended).toBe(true);
        expect(w.verified_by).toBeDefined();
        expect(w.verified_at).toBeDefined();
      });
    });

    it('seeded open bounty has group_min >= 4 (N17)', () => {
      const openBounties = db.getOpenBounties();
      expect(openBounties.length).toBeGreaterThanOrEqual(1);
      openBounties.forEach((b) => {
        expect(b.group_min).toBeGreaterThanOrEqual(4);
      });
    });

    it('joinBounty adds user to bounty', () => {
      const bounties = db.getOpenBounties();
      expect(bounties.length).toBeGreaterThan(0);
      const bid = bounties[0].id;
      db.joinBounty('usr-a1', bid);
      const joined = db.bountyJoins.some((j) => j.bounty_id === bid && j.user_id === 'usr-a1');
      expect(joined).toBe(true);
    });

    it('joinBounty is idempotent', () => {
      const bid = db.getOpenBounties()[0].id;
      db.joinBounty('usr-a1', bid);
      db.joinBounty('usr-a1', bid);
      const count = db.bountyJoins.filter((j) => j.bounty_id === bid && j.user_id === 'usr-a1').length;
      expect(count).toBe(1);
    });
  });

  describe('Games Library (Table 2, Section 8.8)', () => {
    it('seeded games include South Indian traditional games', () => {
      const games = Array.from(db.games.values());
      const names = games.map((g) => g.name);
      expect(names.some((n) => n.includes('Chowka'))).toBe(true);
      expect(names.some((n) => n.includes('Antakshari'))).toBe(true);
      expect(names.some((n) => n.includes('Aadu'))).toBe(true);
    });

    it('unverified games have verified = false', () => {
      const chowka = Array.from(db.games.values()).find((g) => g.name.includes('Chowka'));
      expect(chowka?.verified).toBe(false);
    });

    it('Antakshari is verified by host', () => {
      const antakshari = Array.from(db.games.values()).find((g) => g.name.includes('Antakshari'));
      expect(antakshari?.verified).toBe(true);
      expect(antakshari?.verified_by).toBe('host-01');
    });
  });

  describe('H3b Letter Box Print View (Server Component)', () => {
    it('prompts of all kinds are seeded and accessible', () => {
      const kinds = ['letter', 'table', 'stretch', 'peeve', 'pivot', 'favourite', 'seen'];
      kinds.forEach((kind) => {
        const prompts = Array.from(db.prompts.values()).filter((p) => p.kind === kind);
        expect(prompts.length).toBeGreaterThan(0);
      });
    });

    it('closing demo pod has opener_arm set', () => {
      const pod = db.pods.get('pod-closing');
      expect(pod?.opener_arm).toBeDefined();
      expect(['peeve', 'favourites']).toContain(pod?.opener_arm);
    });
  });

  describe('Cron tick prerequisites', () => {
    it('pod-a and pod-b have wave_start set', () => {
      const podA = db.pods.get('pod-a');
      const podB = db.pods.get('pod-b');
      expect(podA?.wave_start).toBe('2026-11-01');
      expect(podB?.wave_start).toBe('2026-11-01');
    });

    it('pod-closing is in closing status (simulates Day 28 transition)', () => {
      const pod = db.pods.get('pod-closing');
      expect(pod?.status).toBe('closing');
    });

    it('canSeeEvents returns true for usr-closing in closing pod', () => {
      expect(db.canSeeEvents('usr-closing')).toBe(true);
    });
  });
});
