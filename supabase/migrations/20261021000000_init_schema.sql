-- Taranga Tables - Initial Schema & RLS Policies
-- Target: Supabase Postgres (Asia/Kolkata timezone context)

create extension if not exists pgcrypto;

-- Enums
create type user_status as enum (
  'onboarding',
  'screened',
  'waitlisted',
  'in_pod',
  'completed',
  'withdrawn',
  'removed'
);

create type pod_status as enum (
  'forming',
  'letters',
  'tables',
  'closing',
  'closed',
  'cancelled'
);

create type deposit_status as enum (
  'none',
  'pending',
  'held',
  'refunded',
  'forfeited'
);

-- Profiles Table (Data minimisation: no DOB, no phone number, no precise location)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 30),
  role text not null default 'member' check (role in ('member', 'host', 'admin')),
  status user_status not null default 'onboarding',
  is_18_plus boolean not null default false,
  age_method text, -- 'self_declared_stub' | future providers
  age_checked_at timestamptz,
  gender text, -- optional, used only for women-only pods
  wants_women_only boolean not null default false,
  languages text[] not null default '{}',
  interests text[] not null default '{}' check (cardinality(interests) <= 5),
  talk_vs_listen smallint check (talk_vs_listen between 1 and 5),
  planned_vs_spontaneous smallint check (planned_vs_spontaneous between 1 and 5),
  availability jsonb not null default '[]', -- [{dow:4,part:'evening'}]
  area text, -- coarse neighbourhood only
  letter_hour smallint not null default 20 check (letter_hour between 7 and 22),
  created_at timestamptz not null default now()
);

-- Consents Table (Standalone, purpose-specific, versioned, withdrawable)
create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  purpose text not null check (purpose in ('core_service', 'safety_checkin', 'whatsapp_contact', 'content_photos')),
  notice_version text not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

-- Screenings Table (Raw responses discarded; triage band only)
create table if not exists screenings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  instrument_version text not null,
  band text not null check (band in ('none', 'mild', 'elevated')),
  helpline_shown boolean not null default false,
  host_followup_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Venues Table (Public venues only)
create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text,
  public_place boolean not null default true,
  capacity int,
  contact text
);

-- Cycles Table
create table if not exists cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null
);

-- Pods Table (5-7 members, default 6)
create table if not exists pods (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cycles(id),
  name text,
  status pod_status not null default 'forming',
  women_only boolean not null default false,
  capacity smallint not null default 6 check (capacity between 5 and 7),
  arm text not null default 'free' check (arm in ('free', 'deposit')),
  deposit_inr int not null default 0 check (deposit_inr >= 0),
  host_id uuid references profiles(id),
  default_venue_id uuid references venues(id),
  created_at timestamptz not null default now()
);

-- Pod Members
create table if not exists pod_members (
  pod_id uuid references pods(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  left_reason text,
  primary key (pod_id, user_id)
);

create unique index if not exists one_active_pod_per_user 
  on pod_members(user_id) where left_at is null;

-- Prompts Table
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('letter', 'table', 'stretch')),
  level smallint not null check (level between 1 and 3),
  body_en text not null,
  body_kn text,
  active boolean not null default true
);

-- Letters Table (Write-to-unlock, 20-1200 characters)
create table if not exists letters (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid not null references prompts(id),
  seq smallint not null check (seq between 1 and 3),
  body text not null check (char_length(body) between 20 and 1200),
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'published', 'hidden')),
  moderation_flag text,
  submitted_at timestamptz not null default now(),
  unique (pod_id, author_id, seq)
);

-- Letter Reads Table
create table if not exists letter_reads (
  letter_id uuid references letters(id) on delete cascade,
  reader_id uuid references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (letter_id, reader_id)
);

-- Meetups Table
create table if not exists meetups (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  seq smallint not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue_id uuid references venues(id),
  status text not null default 'scheduled' check (status in ('scheduled', 'done', 'cancelled')),
  unique (pod_id, seq)
);

-- RSVPs Table
create table if not exists rsvps (
  meetup_id uuid references meetups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  response text not null check (response in ('yes', 'no', 'maybe')),
  deposit deposit_status not null default 'none',
  payment_ref text,
  responded_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

-- Attendance Table
create table if not exists attendance (
  meetup_id uuid references meetups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  marked_by uuid references profiles(id),
  primary key (meetup_id, user_id)
);

-- Stretch Choices Table (Opt-in discomfort; skippable without penalty)
create table if not exists stretch_choices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pod_id uuid not null references pods(id) on delete cascade,
  prompt_id uuid not null references prompts(id),
  chosen_at timestamptz not null default now(),
  completed_at timestamptz,
  skipped boolean not null default false
);

-- Pod Notes Table (Text only, <= 500 chars, host-moderated)
create table if not exists pod_notes (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 500),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);

-- Blocks Table
create table if not exists blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Safety Reports Table
create table if not exists safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  pod_id uuid references pods(id),
  meetup_id uuid references meetups(id),
  subject_user_id uuid references profiles(id),
  severity text not null check (severity in ('low', 'medium', 'high')),
  category text not null,
  body text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Feedback Table (Anonymous to peers; host sees free_text only if opted-in)
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references meetups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  felt_safe smallint check (felt_safe between 1 and 5),
  felt_included smallint check (felt_included between 1 and 5),
  would_return boolean,
  free_text text,
  share_with_host boolean not null default false,
  created_at timestamptz not null default now(),
  unique (meetup_id, user_id)
);

-- Notifications Table (At most one per user per day, reason text mandatory)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  channel text not null check (channel in ('email', 'whatsapp_link')),
  template_key text not null,
  reason_text text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped'))
);

-- Event Log Table (Names only; props must never contain message text)
create table if not exists event_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  pod_id uuid,
  name text not null,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Audit Log Table (Every admin / host access and mutation)
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text,
  entity_id text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SQL Views & Unlocking Rule (Section 7.3)
-- ============================================================================

-- Function to compute reveal time for letter L viewed by reader U:
-- Next occurrence of reader's letter_hour (Asia/Kolkata) after GREATEST(L.submitted_at, U.submitted_at)
create or replace function calculate_reveal_time(
  l_submitted_at timestamptz,
  u_submitted_at timestamptz,
  u_letter_hour smallint
) returns timestamptz language sql immutable as $$
  with base as (
    select greatest(l_submitted_at, u_submitted_at) at time zone 'Asia/Kolkata' as base_time
  ),
  same_day_target as (
    select date_trunc('day', base_time) + make_interval(hours => u_letter_hour) as target_time,
           base_time
    from base
  )
  select case 
    when base_time <= target_time then target_time at time zone 'Asia/Kolkata'
    else (target_time + interval '1 day') at time zone 'Asia/Kolkata'
  end
  from same_day_target;
$$;

-- View: Pod Members Public Profile (Data Minimisation: display_name and nothing else)
create or replace view v_pod_members_visible as
select 
  pm.pod_id,
  pm.user_id,
  p.display_name,
  pm.joined_at
from pod_members pm
join profiles p on p.id = pm.user_id
where pm.left_at is null;

-- View: Unlocked Letters (Enforces Section 7.3 & R4 / AT6 / AT7)
-- Reader U may see letter L (author A, seq N, same pod) only if:
-- A is not U, L is not hidden, U has a submitted letter with seq N in the same pod,
-- neither user has blocked the other, and now is at or after the reveal time.
create or replace view v_unlocked_letters as
select 
  l.id as letter_id,
  l.pod_id,
  l.seq,
  l.author_id,
  p_author.display_name as author_name,
  l.prompt_id,
  l.body,
  l.submitted_at,
  u_profile.id as reader_id,
  calculate_reveal_time(l.submitted_at, u_letter.submitted_at, u_profile.letter_hour) as reveal_at
from letters l
join profiles p_author on p_author.id = l.author_id
-- Reader must be in the same active pod
join pod_members u_pm on u_pm.pod_id = l.pod_id and u_pm.left_at is null
join profiles u_profile on u_profile.id = u_pm.user_id
-- Reader must have submitted their own letter of same seq N
join letters u_letter on u_letter.pod_id = l.pod_id 
                    and u_letter.author_id = u_profile.id 
                    and u_letter.seq = l.seq
                    and u_letter.status in ('submitted', 'published')
-- Reader cannot be the author (own letters handled separately)
where l.author_id <> u_profile.id
  and l.status in ('submitted', 'published')
  -- Neither user blocked the other
  and not exists (
    select 1 from blocks b 
    where (b.blocker_id = u_profile.id and b.blocked_id = l.author_id)
       or (b.blocker_id = l.author_id and b.blocked_id = u_profile.id)
  )
  -- Reveal time check: now >= reveal_at
  and now() >= calculate_reveal_time(l.submitted_at, u_letter.submitted_at, u_profile.letter_hour);

-- View: Pilot Analytics - Second Meeting Rate (Section 10.2)
create or replace view v_second_meeting_rate as
with m1 as (
  select a.user_id, mt.pod_id from attendance a
  join meetups mt on mt.id = a.meetup_id where mt.seq = 1
),
m2 as (
  select a.user_id, mt.pod_id from attendance a
  join meetups mt on mt.id = a.meetup_id where mt.seq = 2
)
select 
  p.arm,
  count(m1.user_id) as attended_first,
  count(m2.user_id) as attended_second,
  round(100.0 * count(m2.user_id) / nullif(count(m1.user_id), 0), 1) as second_meeting_pct
from m1
join pods p on p.id = m1.pod_id
left join m2 on m2.user_id = m1.user_id and m2.pod_id = m1.pod_id
group by p.arm;

-- View: Pilot Analytics - Show Rate First Table (Section 10.2)
create or replace view v_show_rate_first_table as
select 
  p.arm,
  count(*) filter (where r.response = 'yes') as said_yes,
  count(a.user_id) as showed_up,
  round(100.0 * count(a.user_id) / nullif(count(*) filter (where r.response = 'yes'), 0), 1) as show_pct
from meetups mt
join pods p on p.id = mt.pod_id
join rsvps r on r.meetup_id = mt.id
left join attendance a on a.meetup_id = mt.id and a.user_id = r.user_id
where mt.seq = 1
group by p.arm;

-- ============================================================================
-- Row Level Security (Section 5.1)
-- ============================================================================

alter table profiles enable row level security;
alter table consents enable row level security;
alter table screenings enable row level security;
alter table pods enable row level security;
alter table pod_members enable row level security;
alter table letters enable row level security;
alter table letter_reads enable row level security;
alter table meetups enable row level security;
alter table rsvps enable row level security;
alter table attendance enable row level security;
alter table stretch_choices enable row level security;
alter table pod_notes enable row level security;
alter table blocks enable row level security;
alter table safety_reports enable row level security;
alter table feedback enable row level security;
alter table notifications enable row level security;

-- Profiles: Members read/update own profile; Hosts read members in their pods; Admins read all
create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id or role = 'admin');

create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id);

-- Consents: Members read/write only their own
create policy "consents_self_all" on consents
  for all using (auth.uid() = user_id);

-- Screenings: Members read only their own screening band (never raw responses)
create policy "screenings_self_select" on screenings
  for select using (auth.uid() = user_id);

create policy "screenings_self_insert" on screenings
  for insert with check (auth.uid() = user_id);

-- Pod Members: Members can read pod members of their active pod
create policy "pod_members_pod_select" on pod_members
  for select using (
    pod_id in (select pod_id from pod_members where user_id = auth.uid() and left_at is null)
  );

-- Letters: Authors can always select their own letters
create policy "letters_self_select" on letters
  for select using (author_id = auth.uid());

create policy "letters_self_insert" on letters
  for insert with check (author_id = auth.uid());

-- Pod Notes: Members can read published notes in their active pod
create policy "pod_notes_select" on pod_notes
  for select using (
    status = 'published' and
    pod_id in (select pod_id from pod_members where user_id = auth.uid() and left_at is null) and
    not exists (
      select 1 from blocks b 
      where (b.blocker_id = auth.uid() and b.blocked_id = author_id)
         or (b.blocker_id = author_id and b.blocked_id = auth.uid())
    )
  );

create policy "pod_notes_insert" on pod_notes
  for insert with check (
    author_id = auth.uid() and
    pod_id in (select pod_id from pod_members where user_id = auth.uid() and left_at is null)
  );

-- RSVPs: Members read/write own RSVPs
create policy "rsvps_self_all" on rsvps
  for all using (user_id = auth.uid());

-- Stretch choices: Members read/write own stretch choices
create policy "stretch_choices_self_all" on stretch_choices
  for all using (user_id = auth.uid());

-- Feedback: Members read/write own feedback
create policy "feedback_self_all" on feedback
  for all using (user_id = auth.uid());
