export type UserRole = 'member' | 'host' | 'admin';
export type UserStatus = 'onboarding' | 'screened' | 'waitlisted' | 'in_pod' | 'completed' | 'withdrawn' | 'removed';
export type PodStatus = 'forming' | 'letters' | 'tables' | 'closing' | 'closed' | 'cancelled';
export type DepositStatus = 'none' | 'pending' | 'held' | 'refunded' | 'forfeited';
export type ConsentPurpose = 'core_service' | 'safety_checkin' | 'whatsapp_contact' | 'content_photos' | 'taranga_updates';
export type ScreeningBand = 'none' | 'mild' | 'elevated';
export type PromptKind = 'letter' | 'table' | 'stretch' | 'peeve' | 'pivot' | 'favourite' | 'seen';
export type LetterStatus = 'draft' | 'submitted' | 'published' | 'hidden';
export type MeetupStatus = 'scheduled' | 'done' | 'cancelled';
export type RsvpResponse = 'yes' | 'no' | 'maybe';
export type SafetySeverity = 'low' | 'medium' | 'high';
export type SafetyStatus = 'open' | 'in_review' | 'resolved';

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  status: UserStatus;
  is_18_plus: boolean;
  age_method?: string;
  age_checked_at?: string;
  gender?: string;
  wants_women_only: boolean;
  languages: string[];
  interests: string[];
  talk_vs_listen?: number;
  planned_vs_spontaneous?: number;
  availability: Array<{ dow: number; part: 'morning' | 'afternoon' | 'evening' }>;
  area?: string;
  letter_hour: number;
  created_at: string;
}

export interface Consent {
  id: string;
  user_id: string;
  purpose: ConsentPurpose;
  notice_version: string;
  granted: boolean;
  granted_at: string;
  withdrawn_at?: string;
}

export interface Screening {
  id: string;
  user_id: string;
  instrument_version: string;
  band: ScreeningBand;
  helpline_shown: boolean;
  host_followup_done: boolean;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  area: string;
  public_place: boolean;
  capacity: number;
  contact?: string;
}

export interface Cycle {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
}

export interface Pod {
  id: string;
  cycle_id: string;
  name: string;
  status: PodStatus;
  women_only: boolean;
  capacity: number;
  arm: 'free' | 'deposit';
  deposit_inr: number;
  opener_arm?: 'none' | 'peeve' | 'favourites';
  wave_start?: string;
  host_id?: string;
  default_venue_id?: string;
  created_at: string;
}

export interface PodMember {
  pod_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  left_reason?: string;
}

export interface Prompt {
  id: string;
  kind: PromptKind;
  level: number;
  body_en: string;
  body_kn?: string;
  active: boolean;
}

export interface Letter {
  id: string;
  pod_id: string;
  author_id: string;
  prompt_id: string;
  seq: number;
  body: string;
  status: LetterStatus;
  moderation_flag?: string;
  submitted_at: string;
}

export interface LetterRead {
  letter_id: string;
  reader_id: string;
  read_at: string;
}

export interface Meetup {
  id: string;
  pod_id: string;
  seq: number;
  starts_at: string;
  ends_at: string;
  venue_id?: string;
  status: MeetupStatus;
  low_turnout_flagged_at?: string;
}

export interface Rsvp {
  meetup_id: string;
  user_id: string;
  response: RsvpResponse;
  deposit: DepositStatus;
  payment_ref?: string;
  responded_at: string;
}

export interface Attendance {
  meetup_id: string;
  user_id: string;
  checked_in_at: string;
  marked_by?: string;
}

export interface StretchChoice {
  id: string;
  user_id: string;
  pod_id: string;
  prompt_id: string;
  chosen_at: string;
  completed_at?: string;
  skipped: boolean;
}

export interface PodNote {
  id: string;
  pod_id: string;
  author_id: string;
  body: string;
  status: 'published' | 'hidden';
  created_at: string;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface SafetyReport {
  id: string;
  reporter_id?: string;
  pod_id?: string;
  meetup_id?: string;
  subject_user_id?: string;
  severity: SafetySeverity;
  category: string;
  body: string;
  status: SafetyStatus;
  resolution?: string;
  created_at: string;
  resolved_at?: string;
}

export interface Feedback {
  id: string;
  meetup_id: string;
  user_id: string;
  felt_safe: number;
  felt_included: number;
  would_return: boolean;
  free_text?: string;
  share_with_host: boolean;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  kind: string;
  channel: 'email' | 'whatsapp_link';
  template_key: string;
  reason_text: string;
  scheduled_for: string;
  sent_at?: string;
  status: 'queued' | 'sent' | 'failed' | 'skipped';
}

export interface EventLogRecord {
  id: number;
  user_id?: string;
  pod_id?: string;
  name: string;
  props: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogRecord {
  id: number;
  actor_id?: string;
  action: string;
  entity?: string;
  entity_id?: string;
  created_at: string;
}

export interface Appreciation {
  id: string;
  pod_id: string;
  meetup_id: string;
  author_id: string;
  recipient_id: string;
  body: string;
  status: 'submitted' | 'held' | 'hidden';
  created_at: string;
}

export interface ClosingChoice {
  user_id: string;
  pod_id: string;
  choice: 'keep' | 'community' | 'part';
  created_at: string;
}

export interface WaveFeedback {
  user_id: string;
  pod_id: string;
  connected_end?: number;
  made_friend?: 'yes' | 'maybe' | 'no';
  free_text?: string;
  created_at: string;
}

export interface HostTask {
  id: string;
  host_id?: string;
  pod_id?: string;
  user_id?: string;
  kind: 'reminder' | 'followup' | 'reschedule' | 'late' | 'withdrawal' | 'screening' | 'moderation' | 'safety';
  body: string;
  due_at?: string;
  done_at?: string;
  created_at: string;
}

export interface Game {
  id: string;
  name: string;
  region?: string;
  players_min?: number;
  players_max?: number;
  rules_summary: string;
  source_note?: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
}

export interface Waypoint {
  id: string;
  name: string;
  area?: string;
  is_public: boolean;
  staffed: boolean;
  host_attended: boolean;
  safety_notes?: string;
  verified_by?: string;
  verified_at?: string;
  active: boolean;
}

export interface Bounty {
  id: string;
  waypoint_id: string;
  title: string;
  description: string;
  group_min: number;
  starts_at: string;
  ends_at: string;
  host_contact: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  created_at: string;
}

export interface BountyJoin {
  bounty_id: string;
  user_id: string;
  joined_at: string;
}

export interface PassportStamp {
  pod_id: string;
  waypoint_id: string;
  stamped_at: string;
  confirmed_by?: string;
}

export interface TarangaEvent {
  id: string;
  title: string;
  blurb: string;
  starts_at: string;
  ends_at: string;
  place_name: string;
  capacity?: number;
  signup_url?: string;
  status: 'draft' | 'published' | 'closed';
  created_by?: string;
  created_at: string;
}

export interface EventInterest {
  event_id: string;
  user_id: string;
  created_at: string;
  attended_at?: string;
  marked_by?: string;
}
