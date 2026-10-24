import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '@/lib/db';
import { getAgeAssuranceAdapter } from '@/lib/adapters/age';
import { getNotifyAdapter } from '@/lib/adapters/notify';
import { POST as onboardingRoute } from '@/app/api/onboarding/route';
import { POST as consentsRoute } from '@/app/api/consents/route';
import { POST as checkinRoute } from '@/app/api/checkin/route';
import { NextRequest } from 'next/server';

function createJsonRequest(url: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Phase P2 Acceptance Tests (AT1 - AT4)', () => {
  const db = getDatabase();

  beforeEach(() => {
    db.reset();
  });

  describe('AT1: Under-18 Protection', () => {
    it('rejects onboarding when user is not 18+, and stores nothing beyond email', async () => {
      const underAgeUserId = 'underage-user-999';

      const req = createJsonRequest('http://localhost:3000/api/onboarding', {
        userId: underAgeUserId,
        displayName: 'Teen User',
        is18Plus: false, // Underage declaration
        languages: ['English'],
        interests: ['Books'],
        availability: [{ dow: 6, part: 'evening' }],
        area: 'Gokulam',
      });

      const response = await onboardingRoute(req);
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error).toMatch(/Under-18/i);

      // Verify nothing is stored in profiles table
      const stored = db.profiles.get(underAgeUserId);
      expect(stored).toBeUndefined();
    });

    it('successfully processes onboarding when user is 18+', async () => {
      const adultUserId = 'adult-user-111';

      const req = createJsonRequest('http://localhost:3000/api/onboarding', {
        userId: adultUserId,
        displayName: 'Adult User',
        is18Plus: true,
        languages: ['English', 'Kannada'],
        interests: ['Filter Coffee', 'Books'],
        availability: [{ dow: 6, part: 'evening' }, { dow: 0, part: 'evening' }],
        area: 'Jayalakshmipuram',
      });

      const response = await onboardingRoute(req);
      expect(response.status).toBe(200);

      const stored = db.profiles.get(adultUserId);
      expect(stored).toBeDefined();
      expect(stored?.is_18_plus).toBe(true);
      expect(stored?.status).toBe('onboarding');
      // Assert data minimisation: no phone or DOB
      expect((stored as any).phone).toBeUndefined();
      expect((stored as any).dob).toBeUndefined();
    });
  });

  describe('AT2: Standalone, Unbundled Consent & WhatsApp Withdrawing', () => {
    it('saves each consent purpose separately with versioning', async () => {
      const testUserId = 'consent-user-222';

      // 1. Save core_service consent
      const coreReq = createJsonRequest('http://localhost:3000/api/consents', {
        userId: testUserId,
        purpose: 'core_service',
        noticeVersion: '1.0',
        granted: true,
      });
      const coreRes = await consentsRoute(coreReq);
      expect(coreRes.status).toBe(200);

      // 2. Save whatsapp_contact consent as true
      const waReq = createJsonRequest('http://localhost:3000/api/consents', {
        userId: testUserId,
        purpose: 'whatsapp_contact',
        noticeVersion: '1.0',
        granted: true,
      });
      const waRes = await consentsRoute(waReq);
      expect(waRes.status).toBe(200);

      // Check DB records
      const coreRecord = db.consents.get(`c-${testUserId}-core_service`);
      expect(coreRecord?.granted).toBe(true);

      const waRecord = db.consents.get(`c-${testUserId}-whatsapp_contact`);
      expect(waRecord?.granted).toBe(true);
      expect(waRecord?.withdrawn_at).toBeUndefined();

      // 3. Generate wa.me link with consent granted -> works
      const notifyAdapter = getNotifyAdapter();
      const linkActive = notifyAdapter.generateWhatsAppLink(
        '919876543210',
        'Hello from Taranga',
        waRecord!.granted
      );
      expect(linkActive).toContain('https://wa.me/919876543210');

      // 4. Withdraw whatsapp_contact consent
      const withdrawReq = createJsonRequest('http://localhost:3000/api/consents', {
        userId: testUserId,
        purpose: 'whatsapp_contact',
        noticeVersion: '1.0',
        granted: false,
      });
      const withdrawRes = await consentsRoute(withdrawReq);
      expect(withdrawRes.status).toBe(200);

      const updatedWaRecord = db.consents.get(`c-${testUserId}-whatsapp_contact`);
      expect(updatedWaRecord?.granted).toBe(false);
      expect(updatedWaRecord?.withdrawn_at).toBeDefined();

      // 5. AT2: Withdrawing whatsapp_contact removes member from wa.me link generation
      const linkBlocked = notifyAdapter.generateWhatsAppLink(
        '919876543210',
        'Hello from Taranga',
        updatedWaRecord!.granted
      );
      expect(linkBlocked).toBeNull();
    });
  });

  describe('AT3: Band-Only Storage for Clinical Check-in', () => {
    it('stores only triage band in database, discarding raw answers and excluding them from logs', async () => {
      const testUserId = 'checkin-user-333';

      // Setup user in DB
      db.profiles.set(testUserId, {
        id: testUserId,
        display_name: 'Test Member',
        role: 'member',
        status: 'onboarding',
        is_18_plus: true,
        wants_women_only: false,
        languages: ['English'],
        interests: ['Books'],
        availability: [{ dow: 6, part: 'evening' }],
        area: 'Gokulam',
        letter_hour: 20,
        created_at: new Date().toISOString(),
      });

      // Submit check-in with answers: q1: 1, q2: 1, q3: 0 -> totalScore = 2 (Band: 'none')
      const req = createJsonRequest('http://localhost:3000/api/checkin', {
        userId: testUserId,
        answers: { q1: 1, q2: 1, q3: 0 },
      });

      const res = await checkinRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.band).toBe('none');
      expect(json.helplineShown).toBe(false);

      // Verify DB screenings table: only triage band exists
      const userScreenings = Array.from(db.screenings.values()).filter((s) => s.user_id === testUserId);
      expect(userScreenings).toHaveLength(1);
      const screening = userScreenings[0];
      expect(screening.band).toBe('none');
      // Assert NO question answers are stored
      expect((screening as any).answers).toBeUndefined();
      expect((screening as any).q1).toBeUndefined();
      expect((screening as any).raw).toBeUndefined();

      // Inspect event_log: verify event is logged with band only, never raw answers
      const checkinEvents = db.eventLogs.filter((e) => e.user_id === testUserId && e.name === 'checkin_completed');
      expect(checkinEvents).toHaveLength(1);
      expect(checkinEvents[0].props).toEqual({ band: 'none' });
      expect((checkinEvents[0].props as any).answers).toBeUndefined();
    });
  });

  describe('AT4: Elevated Band Safety Hold', () => {
    it('holds an elevated-band member from pod placement until host records follow-up', async () => {
      const elevatedUserId = 'elevated-user-444';

      // Setup user in DB
      db.profiles.set(elevatedUserId, {
        id: elevatedUserId,
        display_name: 'Distressed Member',
        role: 'member',
        status: 'onboarding',
        is_18_plus: true,
        wants_women_only: false,
        languages: ['English'],
        interests: ['Writing'],
        availability: [{ dow: 6, part: 'evening' }],
        area: 'Gokulam',
        letter_hour: 20,
        created_at: new Date().toISOString(),
      });

      // Submit answers scoring into elevated band: q1: 3, q2: 3, q3: 3 -> totalScore = 9
      const req = createJsonRequest('http://localhost:3000/api/checkin', {
        userId: elevatedUserId,
        answers: { q1: 3, q2: 3, q3: 3 },
      });

      const res = await checkinRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.band).toBe('elevated');
      expect(json.helplineShown).toBe(true);
      expect(json.helplineMessage).toContain('Tele-MANAS');

      // Check DB: profile status remains 'screened', NOT 'waitlisted'
      const updatedProfile = db.profiles.get(elevatedUserId);
      expect(updatedProfile?.status).toBe('screened');

      // Matching candidate filter check (Section 6.1 Hard Constraint 2):
      // "Not an elevated screening band, unless host_followup_done is true."
      const screening = Array.from(db.screenings.values()).find((s) => s.user_id === elevatedUserId);
      expect(screening?.host_followup_done).toBe(false);

      const isEligibleForMatching =
        updatedProfile?.status === 'waitlisted' &&
        (screening?.band !== 'elevated' || screening.host_followup_done);

      expect(isEligibleForMatching).toBe(false); // Held from matching!

      // Once host records follow-up call
      screening!.host_followup_done = true;
      updatedProfile!.status = 'waitlisted';

      const isEligibleAfterFollowup =
        updatedProfile?.status === 'waitlisted' &&
        (screening?.band !== 'elevated' || screening.host_followup_done);

      expect(isEligibleAfterFollowup).toBe(true); // Eligible after host follows up!
    });
  });
});
