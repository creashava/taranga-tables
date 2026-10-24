export type UserRole = 'member' | 'host' | 'admin';
export type UserStatus = 'onboarding' | 'screened' | 'waitlisted' | 'in_pod' | 'completed' | 'withdrawn' | 'removed';
export type PodStatus = 'forming' | 'letters' | 'tables' | 'closing' | 'closed' | 'cancelled';
export type DepositStatus = 'none' | 'pending' | 'held' | 'refunded' | 'forfeited';
export type ConsentPurpose = 'core_service' | 'safety_checkin' | 'whatsapp_contact' | 'content_photos';
export type ScreeningBand = 'none' | 'mild' | 'elevated';
export type PromptKind = 'letter' | 'table' | 'stretch';
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
