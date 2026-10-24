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
  Appreciation,
  ClosingChoice,
  WaveFeedback,
  HostTask,
  Game,
  Waypoint,
  Bounty,
  BountyJoin,
  PassportStamp,
  TarangaEvent,
  EventInterest,
} from './types';
import { calculateRevealTime, isLetterUnlocked } from './time';

export const LETTER_GAP_HOURS = 48; // Section 0 item 10 & D2

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
  public appreciations: Map<string, Appreciation> = new Map();
  public closingChoices: Map<string, ClosingChoice> = new Map();
  public waveFeedback: Map<string, WaveFeedback> = new Map();
  public hostTasks: Map<string, HostTask> = new Map();
  public games: Map<string, Game> = new Map();
  public waypoints: Map<string, Waypoint> = new Map();
  public bounties: Map<string, Bounty> = new Map();
  public bountyJoins: BountyJoin[] = [];
  public passportStamps: PassportStamp[] = [];
  public tarangaEvents: Map<string, TarangaEvent> = new Map();
  public eventInterests: Map<string, EventInterest> = new Map();
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
    this.appreciations.clear();
    this.closingChoices.clear();
    this.waveFeedback.clear();
    this.hostTasks.clear();
    this.games.clear();
    this.waypoints.clear();
    this.bounties.clear();
    this.bountyJoins = [];
    this.passportStamps = [];
    this.tarangaEvents.clear();
    this.eventInterests.clear();
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

    // 3b. v2.0 Prompts: Peeve, Pivot, Favourite, Seen (Section 8.8)
    const peeves = [
      'People who clap when the plane lands.',
      'Group chats that explode at 2 am.',
      'Slow Wi-Fi at a cafe that advertises Wi-Fi.',
      'Meetings that could have been a message.',
      'Songs that start at the wrong moment.',
    ];
    peeves.forEach((text, i) => {
      this.prompts.set(`p-pv${i + 1}`, {
        id: `p-pv${i + 1}`,
        kind: 'peeve',
        level: 1,
        body_en: text,
        active: true,
      });
    });

    this.prompts.set('p-pvt', {
      id: 'p-pvt',
      kind: 'pivot',
      level: 1,
      body_en: 'What would the perfect version look like?',
      active: true,
    });

    const favourites = [
      'A snack you’d recommend from a Mysuru street stall.',
      'A song you never skip.',
      'A film you can watch again and again.',
    ];
    favourites.forEach((text, i) => {
      this.prompts.set(`p-fv${i + 1}`, {
        id: `p-fv${i + 1}`,
        kind: 'favourite',
        level: 1,
        body_en: text,
        active: true,
      });
    });

    this.prompts.set('p-sn1', {
      id: 'p-sn1',
      kind: 'seen',
      level: 1,
      body_en: 'Say one specific thing someone did or said that you liked.',
      body_kn: 'ಇನ್ನೊಬ್ಬ ವ್ಯಕ್ತಿ ಮಾಡಿದ ಅಥವಾ ಹೇಳಿದ ನಿಮಗೆ ಇಷ್ಟವಾದ ಒಂದು ನಿರ್ದಿಷ್ಟ ವಿಷಯವನ್ನು ತಿಳಿಸಿ.',
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

    this.profiles.set('admin-01', {
      id: 'admin-01',
      display_name: 'Admin User',
      role: 'admin',
      status: 'completed',
      is_18_plus: true,
      age_method: 'self_declared_stub',
      area: 'Gokulam',
      letter_hour: 20,
      wants_women_only: false,
      languages: ['English', 'Kannada'],
      interests: ['Community'],
      availability: [{ dow: 6, part: 'evening' }],
      created_at: new Date('2026-10-01').toISOString(),
    });

    // 5. 12 Fake Members (Pod A & Pod B) + Closing Persona
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

    const closingMember = { id: 'usr-closing', name: 'Demo Priya', area: 'Gokulam', interests: ['Books', 'Tea'], lang: ['English', 'Kannada'] };

    [...membersA, ...membersB, closingMember].forEach((m) => {
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
      opener_arm: 'peeve',
      wave_start: '2026-11-01',
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
      opener_arm: 'favourites',
      wave_start: '2026-11-01',
      host_id: 'host-01',
      default_venue_id: 'v-02',
      created_at: new Date('2026-10-18').toISOString(),
    });

    // Closing Demo Pod (Section 8.8)
    this.pods.set('pod-closing', {
      id: 'pod-closing',
      cycle_id: 'c-01',
      name: 'Lalitha Wave (Closing Demo)',
      status: 'closing',
      women_only: false,
      capacity: 6,
      arm: 'free',
      deposit_inr: 0,
      opener_arm: 'peeve',
      wave_start: '2026-09-26',
      host_id: 'host-01',
      default_venue_id: 'v-01',
      created_at: new Date('2026-09-26').toISOString(),
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

    this.podMembers.push({
      pod_id: 'pod-closing',
      user_id: 'usr-closing',
      joined_at: new Date('2026-09-26').toISOString(),
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

    // 9. v2.0 Games (Section 8.8)
    this.games.set('game-01', {
      id: 'game-01',
      name: 'Chowka Bhara',
      region: 'South India',
      players_min: 2,
      players_max: 4,
      rules_summary: 'Race tokens around a cross-shaped board using cowrie or dice throws; local house rules differ.',
      source_note: 'Traditional Indian race game.',
      verified: false,
    });
    this.games.set('game-02', {
      id: 'game-02',
      name: 'Aadu Huli Aata (Lambs and Tigers)',
      region: 'Karnataka',
      players_min: 2,
      players_max: 2,
      rules_summary: 'A few tigers try to capture many goats on a triangle-and-lines board; goats win by trapping the tigers.',
      source_note: 'Ancient Karnataka asymmetric board game.',
      verified: false,
    });
    this.games.set('game-03', {
      id: 'game-03',
      name: 'Alagulimane (Pallanguzhi family)',
      region: 'Karnataka, Tamil Nadu',
      players_min: 2,
      players_max: 2,
      rules_summary: 'Players sow seeds around two rows of pits and capture; counts and variants differ by home.',
      source_note: 'Mancala variant common in South India.',
      verified: false,
    });
    this.games.set('game-04', {
      id: 'game-04',
      name: 'Antakshari',
      region: 'India',
      players_min: 4,
      players_max: 12,
      rules_summary: 'Teams sing a song starting with the last letter of the previous song.',
      source_note: 'Popular parlour singing game.',
      verified: true,
      verified_by: 'host-01',
      verified_at: new Date('2026-10-20').toISOString(),
    });

    // 10. v2.0 Waypoints (Section 8.8, N17: public, staffed or host-attended, verified)
    this.waypoints.set('wp-01', {
      id: 'wp-01',
      name: 'Devaraja Market',
      area: 'Sayyaji Rao Road',
      is_public: true,
      staffed: true,
      host_attended: true,
      safety_notes: 'Public municipal market, bustling daytime activity, host meets group at north entrance.',
      verified_by: 'host-01',
      verified_at: new Date('2026-10-20').toISOString(),
      active: true,
    });
    this.waypoints.set('wp-02', {
      id: 'wp-02',
      name: 'Kukkarahalli Lake Walkway',
      area: 'Saraswathipuram',
      is_public: true,
      staffed: false,
      host_attended: true,
      safety_notes: 'University lake perimeter path, open daylight hours only, host stays with pod.',
      verified_by: 'host-01',
      verified_at: new Date('2026-10-20').toISOString(),
      active: true,
    });

    // 11. v2.0 Bounty (Section 8.8, N17: group min 4, 07:00-18:30 IST)
    this.bounties.set('bounty-01', {
      id: 'bounty-01',
      waypoint_id: 'wp-01',
      title: 'Market colours',
      description: 'As a group of 4+, find three things in the market that share one colour, then agree on a favourite.',
      group_min: 4,
      starts_at: '2026-11-10T10:00:00+05:30',
      ends_at: '2026-11-10T12:00:00+05:30',
      host_contact: '+91 98450 12345',
      status: 'open',
      created_at: new Date('2026-10-20').toISOString(),
    });

    // 12. v2.0 Taranga Events (Section 1.5, 8.7, N18: no countdown, calm card, after wave)
    this.tarangaEvents.set('te-01', {
      id: 'te-01',
      title: 'Mysuru Heritage Walk & Filter Coffee',
      blurb: 'A quiet morning walk exploring heritage stone arches followed by fresh coffee in Chamarajapuram.',
      starts_at: '2026-12-05T07:30:00+05:30',
      ends_at: '2026-12-05T09:30:00+05:30',
      place_name: 'Chamarajapuram Arch',
      capacity: 25,
      status: 'published',
      created_by: 'host-01',
      created_at: new Date('2026-10-20').toISOString(),
    });
    this.tarangaEvents.set('te-02', {
      id: 'te-02',
      title: 'Open Board Game Evening',
      blurb: 'Slow traditional games, warm tea, and conversation at a public community space.',
      starts_at: '2026-12-12T16:00:00+05:30',
      ends_at: '2026-12-12T18:30:00+05:30',
      place_name: 'Gokulam Community Garden',
      capacity: 30,
      status: 'published',
      created_by: 'host-01',
      created_at: new Date('2026-10-20').toISOString(),
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
  // v2.0: Appreciations (Seen Cards - M14, Section 7.2 & 7.3)
  // ==========================================================================

  public canReadAppreciation(recipientId: string, apprec: Appreciation, currentTime: Date = new Date()): boolean {
    if (apprec.recipient_id !== recipientId || apprec.status !== 'submitted') {
      return false;
    }
    const meetup = this.meetups.get(apprec.meetup_id);
    if (!meetup) return false;

    const recipient = this.profiles.get(recipientId);
    const letterHour = recipient?.letter_hour ?? 20;

    // Delivery is recipient's next letter hour after meetup ended
    const meetupEnd = new Date(meetup.ends_at);
    const revealTime = calculateRevealTime(meetup.ends_at, meetup.ends_at, letterHour);
    return currentTime.getTime() >= revealTime.getTime();
  }

  public getReceivedAppreciations(recipientId: string, currentTime: Date = new Date()): Appreciation[] {
    return Array.from(this.appreciations.values()).filter((a) =>
      this.canReadAppreciation(recipientId, a, currentTime)
    );
  }

  public submitAppreciation(
    authorId: string,
    podId: string,
    meetupId: string,
    recipientId: string,
    body: string
  ): Appreciation {
    if (authorId === recipientId) {
      throw new Error('Cannot write a Seen card to yourself');
    }
    if (body.trim().length < 10 || body.trim().length > 200) {
      throw new Error('Seen card must be between 10 and 200 characters');
    }
    // Check if already submitted for this meetup + author + recipient
    const existing = Array.from(this.appreciations.values()).find(
      (a) => a.meetup_id === meetupId && a.author_id === authorId && a.recipient_id === recipientId
    );
    if (existing) {
      throw new Error('Appreciation already submitted for this member for this table');
    }

    const id = `apprec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newApprec: Appreciation = {
      id,
      pod_id: podId,
      meetup_id: meetupId,
      author_id: authorId,
      recipient_id: recipientId,
      body: body.trim(),
      status: 'submitted',
      created_at: new Date().toISOString(),
    };
    this.appreciations.set(id, newApprec);
    return newApprec;
  }

  // ==========================================================================
  // v2.0: Taranga Events Funnel (M18, H10, Section 1.5, 7.2, N18)
  // ==========================================================================

  public canSeeEvents(userId: string): boolean {
    const prof = this.profiles.get(userId);
    if (prof?.role === 'host' || prof?.role === 'admin') return true;

    // Must be in a pod that is closing or closed (N18)
    const memberships = this.podMembers.filter((pm) => pm.user_id === userId && !pm.left_at);
    return memberships.some((pm) => {
      const pod = this.pods.get(pm.pod_id);
      return pod?.status === 'closing' || pod?.status === 'closed';
    });
  }

  public getPublishedEvents(userId: string): TarangaEvent[] {
    if (!this.canSeeEvents(userId)) return [];
    // Max 2 upcoming events (Section 1.5 & M18)
    return Array.from(this.tarangaEvents.values())
      .filter((e) => e.status === 'published')
      .slice(0, 2);
  }

  public recordEventInterest(userId: string, eventId: string): EventInterest {
    const key = `${eventId}_${userId}`;
    const interest: EventInterest = {
      event_id: eventId,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    this.eventInterests.set(key, interest);
    return interest;
  }

  public recordEventAttendance(markedBy: string, userId: string, eventId: string): void {
    const key = `${eventId}_${userId}`;
    let interest = this.eventInterests.get(key);
    if (!interest) {
      interest = {
        event_id: eventId,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
    }
    interest.attended_at = new Date().toISOString();
    interest.marked_by = markedBy;
    this.eventInterests.set(key, interest);
  }

  // ==========================================================================
  // v2.0: Bounties & Quests (M16, Section 7.2, N17)
  // ==========================================================================

  public getOpenBounties(): Bounty[] {
    return Array.from(this.bounties.values()).filter((b) => b.status === 'open');
  }

  public joinBounty(userId: string, bountyId: string): BountyJoin {
    const bounty = this.bounties.get(bountyId);
    if (!bounty || bounty.status !== 'open') {
      throw new Error('Bounty is not open');
    }
    const alreadyJoined = this.bountyJoins.some((j) => j.bounty_id === bountyId && j.user_id === userId);
    if (alreadyJoined) {
      return this.bountyJoins.find((j) => j.bounty_id === bountyId && j.user_id === userId)!;
    }
    const join: BountyJoin = {
      bounty_id: bountyId,
      user_id: userId,
      joined_at: new Date().toISOString(),
    };
    this.bountyJoins.push(join);
    return join;
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
