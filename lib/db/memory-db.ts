import {
  Profile,
  Consent,
  Screening,
  Venue,
  Cycle,
  Pod,
  PodMember,
  Prompt,
  Letter,
  Meetup,
  Rsvp,
  Attendance,
  StretchChoice,
  PodNote,
  Block,
  SafetyReport,
  Feedback,
  NotificationRecord,
  EventLogRecord,
  AuditLogRecord,
} from './types';
import { calculateRevealTime, isLetterUnlocked } from './time';

export class MemoryDatabase {
  public profiles: Map<string, Profile> = new Map();
  public consents: Map<string, Consent> = new Map();
  public screenings: Map<string, Screening> = new Map();
  public venues: Map<string, Venue> = new Map();
  public cycles: Map<string, Cycle> = new Map();
  public pods: Map<string, Pod> = new Map();
  public podMembers: PodMember[] = [];
  public prompts: Map<string, Prompt> = new Map();
  public letters: Map<string, Letter> = new Map();
  public meetups: Map<string, Meetup> = new Map();
  public rsvps: Map<string, Rsvp> = new Map();
  public attendance: Attendance[] = [];
  public stretchChoices: Map<string, StretchChoice> = new Map();
  public podNotes: Map<string, PodNote> = new Map();
  public blocks: Block[] = [];
  public safetyReports: Map<string, SafetyReport> = new Map();
  public feedback: Map<string, Feedback> = new Map();
  public notifications: Map<string, NotificationRecord> = new Map();
  public eventLogs: EventLogRecord[] = [];
  public auditLogs: AuditLogRecord[] = [];

  private eventIdSeq = 1;
  private auditIdSeq = 1;

  constructor() {
    this.seed();
  }

  public reset(): void {
    this.profiles.clear();
    this.consents.clear();
    this.screenings.clear();
    this.venues.clear();
    this.cycles.clear();
    this.pods.clear();
    this.podMembers = [];
    this.prompts.clear();
    this.letters.clear();
    this.meetups.clear();
    this.rsvps.clear();
    this.attendance = [];
    this.stretchChoices.clear();
    this.podNotes.clear();
    this.blocks = [];
    this.safetyReports.clear();
    this.feedback.clear();
    this.notifications.clear();
    this.eventLogs = [];
    this.auditLogs = [];
    this.eventIdSeq = 1;
    this.auditIdSeq = 1;
    this.seed();
  }

  public seed(): void {
    // 1. Venues
    this.venues.set('v-01', {
      id: 'v-01',
      name: 'Old House Cafe',
      area: 'Gokulam',
      public_place: true,
      capacity: 30,
      contact: 'Old House Staff',
    });
    this.venues.set('v-02', {
      id: 'v-02',
      name: 'Minimalist Coffee Studio',
      area: 'Jayalakshmipuram',
      public_place: true,
      capacity: 20,
      contact: 'Minimalist Staff',
    });

    // 2. Cycle
    this.cycles.set('c-01', {
      id: 'c-01',
      name: 'Wave 1 - Mysuru Pilot',
      starts_on: '2026-11-01',
      ends_on: '2026-11-28',
    });

    // 3. Prompts (Section 8.4)
    this.prompts.set('p-l1', {
      id: 'p-l1',
      kind: 'letter',
      level: 1,
      body_en: 'Something small that made your week better.',
      body_kn: 'ನಿಮ್ಮ ವಾರವನ್ನು ಉತ್ತಮಗೊಳಿಸಿದ ಒಂದು ಸಣ್ಣ ವಿಷಯ.',
      active: true,
    });
    this.prompts.set('p-l2', {
      id: 'p-l2',
      kind: 'letter',
      level: 2,
      body_en: 'A place in Mysuru that feels like yours, and why.',
      body_kn: 'ನಿಮ್ಮದು ಎಂದು ಭಾವಿಸುವ ಮೈಸೂರಿನ ಒಂದು ಸ್ಥಳ ಮತ್ತು ಏಕೆ.',
      active: true,
    });
    this.prompts.set('p-l3', {
      id: 'p-l3',
      kind: 'letter',
      level: 3,
      body_en: "Something you're quietly working on, or hoping for.",
      body_kn: 'ನೀವು ಶ್ರಮಿಸುತ್ತಿರುವ ಅಥವಾ ಆಶಿಸುತ್ತಿರುವ ಒಂದು ವಿಷಯ.',
      active: true,
    });

    this.prompts.set('p-t1', {
      id: 'p-t1',
      kind: 'table',
      level: 1,
      body_en: "What's the best thing you ate this month?",
      body_kn: 'ಈ ತಿಂಗಳು ನೀವು ತಿಂದ ಅತ್ಯುತ್ತಮ ಆಹಾರ ಯಾವುದು?',
      active: true,
    });
    this.prompts.set('p-t2', {
      id: 'p-t2',
      kind: 'table',
      level: 2,
      body_en: "What's something you changed your mind about recently?",
      body_kn: 'ಇತ್ತೀಚೆಗೆ ನೀವು ನಿಮ್ಮ ಮನಸ್ಸನ್ನು ಬದಲಾಯಿಸಿಕೊಂಡ ಒಂದು ವಿಷಯವೇನು?',
      active: true,
    });
    this.prompts.set('p-t3', {
      id: 'p-t3',
      kind: 'table',
      level: 3,
      body_en: 'When do you feel most like yourself?',
      body_kn: 'ನೀವು ಯಾವಾಗ ನಿಮ್ಮಂತೆಯೇ ಹೆಚ್ಚು ಇರುತ್ತೀರಿ?',
      active: true,
    });

    this.prompts.set('p-s1', {
      id: 'p-s1',
      kind: 'stretch',
      level: 1,
      body_en: 'Tell one person at the next table something you liked about their letter.',
      body_kn: 'ಮುಂದಿನ ಮೇಜಿನಲ್ಲಿರುವ ಒಬ್ಬ ವ್ಯಕ್ತಿಗೆ ಅವರ ಪತ್ರದಲ್ಲಿ ನಿಮಗೆ ಇಷ್ಟವಾದ ವಿಷಯ ತಿಳಿಸಿ.',
      active: true,
    });
    this.prompts.set('p-s2', {
      id: 'p-s2',
      kind: 'stretch',
      level: 2,
      body_en: "Ask someone a question you'd normally skip.",
      body_kn: 'ನೀವು ಸಾಮಾನ್ಯವಾಗಿ ಕೇಳಲು ಹಿಂದೇಟು ಹಾಕುವ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.',
      active: true,
    });
    this.prompts.set('p-s3', {
      id: 'p-s3',
      kind: 'stretch',
      level: 3,
      body_en: "Share one thing you're nervous about right now.",
      body_kn: 'ಈ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮನ್ನು ಆತಂಕಕ್ಕೊಳಪಡಿಸುವ ಒಂದು ವಿಷಯವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.',
      active: true,
    });

    // 4. Host & Admin
    this.profiles.set('host-01', {
      id: 'host-01',
      display_name: 'Varun (Host)',
      role: 'host',
      status: 'completed',
      is_18_plus: true,
      age_method: 'self_declared_stub',
      area: 'Jayalakshmipuram',
      letter_hour: 20,
      wants_women_only: false,
      languages: ['English', 'Kannada'],
      interests: ['Community', 'Reading'],
      availability: [{ dow: 6, part: 'evening' }, { dow: 0, part: 'evening' }],
      created_at: new Date('2026-10-01').toISOString(),
    });

    // 5. 12 Fake Members (Pod A & Pod B)
    const membersA = [
      { id: 'usr-a1', name: 'Aarav-Fake', area: 'Gokulam', interests: ['Coffee', 'Cycling', 'Books'], lang: ['English', 'Kannada'] },
      { id: 'usr-a2', name: 'Bhavana-Fake', area: 'Jayalakshmipuram', interests: ['Architecture', 'Art'], lang: ['English', 'Kannada'] },
      { id: 'usr-a3', name: 'Chetan-Fake', area: 'VV Mohalla', interests: ['Books', 'Heritage Walks'], lang: ['English', 'Hindi'] },
      { id: 'usr-a4', name: 'Deepa-Fake', area: 'Gokulam', interests: ['Coffee', 'Gardening'], lang: ['English', 'Kannada'] },
      { id: 'usr-a5', name: 'Eshwar-Fake', area: 'KRS Road', interests: ['Podcasts', 'Running'], lang: ['English'] },
      { id: 'usr-a6', name: 'Farah-Fake', area: 'Jayalakshmipuram', interests: ['Art', 'Books'], lang: ['English', 'Kannada'] },
    ];

    const membersB = [
      { id: 'usr-b1', name: 'Girish-Fake', area: 'Gokulam', interests: ['Coffee', 'Writing'], lang: ['English', 'Kannada'] },
      { id: 'usr-b2', name: 'Harini-Fake', area: 'Kuvempunagar', interests: ['Birds', 'History'], lang: ['English', 'Kannada'] },
      { id: 'usr-b3', name: 'Imran-Fake', area: 'Saraswathipuram', interests: ['Writing', 'Poetry'], lang: ['English', 'Hindi'] },
      { id: 'usr-b4', name: 'Jyothi-Fake', area: 'Gokulam', interests: ['Coffee', 'Cinema'], lang: ['English', 'Kannada'] },
      { id: 'usr-b5', name: 'Karthik-Fake', area: 'Jayalakshmipuram', interests: ['Yoga', 'Reading'], lang: ['English'] },
      { id: 'usr-b6', name: 'Leela-Fake', area: 'VV Mohalla', interests: ['Cinema', 'History'], lang: ['English', 'Kannada'] },
    ];

    [...membersA, ...membersB].forEach((m) => {
      this.profiles.set(m.id, {
        id: m.id,
        display_name: m.name,
        role: 'member',
        status: 'in_pod',
        is_18_plus: true,
        age_method: 'self_declared_stub',
        wants_women_only: false,
        languages: m.lang,
        interests: m.interests,
        talk_vs_listen: 3,
        planned_vs_spontaneous: 3,
        availability: [{ dow: 6, part: 'evening' }, { dow: 0, part: 'evening' }],
        area: m.area,
        letter_hour: 20,
        created_at: new Date('2026-10-15').toISOString(),
      });

      this.consents.set(`c-${m.id}-core`, {
        id: `c-${m.id}-core`,
        user_id: m.id,
        purpose: 'core_service',
        notice_version: '1.0',
        granted: true,
        granted_at: new Date('2026-10-15').toISOString(),
      });
      this.consents.set(`c-${m.id}-safety`, {
        id: `c-${m.id}-safety`,
        user_id: m.id,
        purpose: 'safety_checkin',
        notice_version: '1.0',
        granted: true,
        granted_at: new Date('2026-10-15').toISOString(),
      });
      this.consents.set(`c-${m.id}-wa`, {
        id: `c-${m.id}-wa`,
        user_id: m.id,
        purpose: 'whatsapp_contact',
        notice_version: '1.0',
        granted: true,
        granted_at: new Date('2026-10-15').toISOString(),
      });

      this.screenings.set(`s-${m.id}`, {
        id: `s-${m.id}`,
        user_id: m.id,
        instrument_version: '1.0-draft',
        band: 'none',
        helpline_shown: false,
        host_followup_done: false,
        created_at: new Date('2026-10-15').toISOString(),
      });
    });

    // 6. Pods
    this.pods.set('pod-a', {
      id: 'pod-a',
      cycle_id: 'c-01',
      name: 'Kaveri Wave (Free)',
      status: 'letters',
      women_only: false,
      capacity: 6,
      arm: 'free',
      deposit_inr: 0,
      host_id: 'host-01',
      default_venue_id: 'v-01',
      created_at: new Date('2026-10-18').toISOString(),
    });

    this.pods.set('pod-b', {
      id: 'pod-b',
      cycle_id: 'c-01',
      name: 'Chamundi Wave (Deposit)',
      status: 'letters',
      women_only: false,
      capacity: 6,
      arm: 'deposit',
      deposit_inr: 200,
      host_id: 'host-01',
      default_venue_id: 'v-02',
      created_at: new Date('2026-10-18').toISOString(),
    });

    // 7. Pod Members
    membersA.forEach((m) => {
      this.podMembers.push({
        pod_id: 'pod-a',
        user_id: m.id,
        joined_at: new Date('2026-10-18').toISOString(),
      });
    });

    membersB.forEach((m) => {
      this.podMembers.push({
        pod_id: 'pod-b',
        user_id: m.id,
        joined_at: new Date('2026-10-18').toISOString(),
      });
    });

    // 8. Meetups (Meetup 1, 2, 3)
    this.meetups.set('m-a1', {
      id: 'm-a1',
      pod_id: 'pod-a',
      seq: 1,
      starts_at: '2026-11-07T17:30:00+05:30',
      ends_at: '2026-11-07T19:00:00+05:30',
      venue_id: 'v-01',
      status: 'scheduled',
    });
    this.meetups.set('m-a2', {
      id: 'm-a2',
      pod_id: 'pod-a',
      seq: 2,
      starts_at: '2026-11-14T17:30:00+05:30',
      ends_at: '2026-11-14T19:00:00+05:30',
      venue_id: 'v-01',
      status: 'scheduled',
    });
    this.meetups.set('m-a3', {
      id: 'm-a3',
      pod_id: 'pod-a',
      seq: 3,
      starts_at: '2026-11-21T17:30:00+05:30',
      ends_at: '2026-11-21T19:00:00+05:30',
      venue_id: 'v-01',
      status: 'scheduled',
    });

    this.meetups.set('m-b1', {
      id: 'm-b1',
      pod_id: 'pod-b',
      seq: 1,
      starts_at: '2026-11-08T17:30:00+05:30',
      ends_at: '2026-11-08T19:00:00+05:30',
      venue_id: 'v-02',
      status: 'scheduled',
    });
    this.meetups.set('m-b2', {
      id: 'm-b2',
      pod_id: 'pod-b',
      seq: 2,
      starts_at: '2026-11-15T17:30:00+05:30',
      ends_at: '2026-11-15T19:00:00+05:30',
      venue_id: 'v-02',
      status: 'scheduled',
    });
    this.meetups.set('m-b3', {
      id: 'm-b3',
      pod_id: 'pod-b',
      seq: 3,
      starts_at: '2026-11-22T17:30:00+05:30',
      ends_at: '2026-11-22T19:00:00+05:30',
      venue_id: 'v-02',
      status: 'scheduled',
    });
  }

  // ==========================================================================
  // RLS & Isolation Queries
  // ==========================================================================

  /**
   * AT10: Given a member, then they can read only display_name for other pod members,
   * and nothing for people outside their pod.
   */
  public getPodMembersVisibleForMember(callerId: string): Array<{ pod_id: string; user_id: string; display_name: string }> {
    const callerActivePod = this.podMembers.find((pm) => pm.user_id === callerId && !pm.left_at);
    if (!callerActivePod) return [];

    const samePodMembers = this.podMembers.filter((pm) => pm.pod_id === callerActivePod.pod_id && !pm.left_at);
    return samePodMembers.map((pm) => {
      const prof = this.profiles.get(pm.user_id);
      return {
        pod_id: pm.pod_id,
        user_id: pm.user_id,
        display_name: prof?.display_name || 'Member',
      };
    });
  }

  /**
   * Section 7.3 & AT6 / AT7:
   * Reader U may see letter L (author A, seq N, same pod) only if:
   * - A is not U
   * - L is not hidden
   * - U has a submitted letter with seq N in the same pod
   * - Neither user has blocked the other
   * - Now is at or after the reveal time
   */
  public getUnlockedLettersForReader(
    readerId: string,
    seq: number,
    currentTime: Date = new Date()
  ): Array<{ letter: Letter; author_name: string; reveal_at: Date }> {
    const readerProfile = this.profiles.get(readerId);
    if (!readerProfile) return [];

    const readerMembership = this.podMembers.find((pm) => pm.user_id === readerId && !pm.left_at);
    if (!readerMembership) return [];

    // Check if reader has submitted their own letter for sequence N (AT6)
    const readerLetter = Array.from(this.letters.values()).find(
      (l) => l.pod_id === readerMembership.pod_id && l.author_id === readerId && l.seq === seq && l.status !== 'draft'
    );

    if (!readerLetter) {
      // Reader has not submitted letter N -> 0 rows unlocked!
      return [];
    }

    const eligibleLetters: Array<{ letter: Letter; author_name: string; reveal_at: Date }> = [];

    for (const letter of this.letters.values()) {
      if (letter.pod_id !== readerMembership.pod_id) continue;
      if (letter.seq !== seq) continue;
      if (letter.author_id === readerId) continue; // Own letters handled separately
      if (letter.status === 'hidden' || letter.status === 'draft') continue;

      // Check blocks between reader and author
      const isBlocked = this.blocks.some(
        (b) =>
          (b.blocker_id === readerId && b.blocked_id === letter.author_id) ||
          (b.blocker_id === letter.author_id && b.blocked_id === readerId)
      );
      if (isBlocked) continue;

      // Calculate reveal time
      const revealAt = calculateRevealTime(letter.submitted_at, readerLetter.submitted_at, readerProfile.letter_hour);

      // Reveal time check: now >= reveal_at (AT7)
      if (currentTime.getTime() >= revealAt.getTime()) {
        const author = this.profiles.get(letter.author_id);
        eligibleLetters.push({
          letter,
          author_name: author?.display_name || 'Pod Member',
          reveal_at: revealAt,
        });
      }
    }

    return eligibleLetters;
  }

  /**
   * Authors can always read their own letters (Rule R4)
   */
  public getOwnLetters(authorId: string): Letter[] {
    return Array.from(this.letters.values()).filter((l) => l.author_id === authorId);
  }

  // ==========================================================================
  // Auditing & Event Logging
  // ==========================================================================

  public logEvent(name: string, userId?: string, podId?: string, props: Record<string, unknown> = {}): EventLogRecord {
    const record: EventLogRecord = {
      id: this.eventIdSeq++,
      user_id: userId,
      pod_id: podId,
      name,
      props, // Props must never contain message or note text
      created_at: new Date().toISOString(),
    };
    this.eventLogs.push(record);
    return record;
  }

  public logAudit(action: string, actorId?: string, entity?: string, entityId?: string): AuditLogRecord {
    const record: AuditLogRecord = {
      id: this.auditIdSeq++,
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.push(record);
    return record;
  }
}

// Singleton in-memory instance
let dbInstance: MemoryDatabase | null = null;

export function getDatabase(): MemoryDatabase {
  if (!dbInstance) {
    dbInstance = new MemoryDatabase();
  }
  return dbInstance;
}
