-- ============================================================================
-- Taranga Tables: Standalone Migration (0001_init.sql)
-- v2.0 Specification Section 7
-- Applied in order: extensions, types, tables, indexes, functions, triggers,
-- row level security, views, grants.
-- ============================================================================

create extension if not exists pgcrypto;

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

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  role text not null default 'member' check (role in ('member', 'host', 'admin')),
  status user_status not null default 'onboarding',
  is_18_plus boolean not null default false,
  age_method text,
  age_checked_at timestamptz,
  gender text check (gender in ('woman', 'man', 'another', 'undisclosed')),
  wants_women_only boolean not null default false,
  languages text[] not null default '{}',
  interests text[] not null default '{}' check (cardinality(interests) <= 5),
  talk_vs_listen smallint check (talk_vs_listen between 1 and 5),
  planned_vs_spontaneous smallint check (planned_vs_spontaneous between 1 and 5),
  connected_start smallint check (connected_start between 1 and 5),
  availability jsonb not null default '[]',
  area text,
  letter_hour smallint not null default 20 check (letter_hour between 7 and 22),
  locale text not null default 'en' check (locale in ('en', 'kn')),
  email_notifications boolean not null default true,
  created_at timestamptz not null default now()
);

-- Consents
create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  purpose text not null check (purpose in (
    'core_service',
    'safety_checkin',
    'whatsapp_contact',
    'content_photos',
    'taranga_updates'
  )),
  notice_version text not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);
create index if not exists idx_consents_user_purpose on consents(user_id, purpose);

-- Screenings
create table if not exists screenings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  instrument_version text not null,
  band text not null check (band in ('none', 'mild', 'elevated')),
  helpline_shown boolean not null default false,
  host_followup_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Venues
create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text,
  public_place boolean not null default true check (public_place),
  capacity int,
  contact text,
  active boolean not null default true
);

-- Cycles
create table if not exists cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date not null
);

-- Pods
create table if not exists pods (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cycles(id),
  name text,
  status pod_status not null default 'forming',
  wave_start date,
  women_only boolean not null default false,
  capacity smallint not null default 6 check (capacity between 5 and 7),
  arm text not null default 'free' check (arm in ('free', 'deposit')),
  deposit_inr int not null default 0 check (deposit_inr >= 0),
  opener_arm text not null default 'none' check (opener_arm in ('none', 'peeve', 'favourites')),
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
create unique index if not exists one_active_pod_per_user on pod_members(user_id) where left_at is null;

-- Prompts
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('letter', 'table', 'stretch', 'peeve', 'pivot', 'favourite', 'seen')),
  level smallint not null default 1 check (level between 1 and 3),
  body_en text not null,
  body_kn text,
  active boolean not null default true
);

-- Letters
create table if not exists letters (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid not null references prompts(id),
  seq smallint not null check (seq between 1 and 3),
  body text not null check (char_length(body) between 20 and 1200),
  status text not null default 'submitted' check (status in ('submitted', 'held', 'hidden')),
  moderation_flag text,
  submitted_at timestamptz not null default now(),
  unique (pod_id, author_id, seq)
);

-- Meetups
create table if not exists meetups (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  seq smallint not null check (seq between 1 and 3),
  kind text not null default 'table' check (kind in ('table', 'game')),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  venue_id uuid references venues(id),
  status text not null default 'scheduled' check (status in ('scheduled', 'done', 'cancelled')),
  low_turnout_flagged_at timestamptz,
  unique (pod_id, seq)
);

-- RSVPs
create table if not exists rsvps (
  meetup_id uuid references meetups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  response text not null check (response in ('yes', 'no', 'maybe')),
  deposit deposit_status not null default 'none',
  payment_ref text,
  responded_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

-- Attendance
create table if not exists attendance (
  meetup_id uuid references meetups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  marked_by uuid references profiles(id),
  primary key (meetup_id, user_id)
);

-- Payments Mock
create table if not exists payments_mock (
  ref text primary key,
  user_id uuid not null,
  meetup_id uuid not null,
  amount_inr int not null,
  status text not null check (status in ('held', 'refunded', 'forfeited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stretch Choices
create table if not exists stretch_choices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pod_id uuid not null references pods(id) on delete cascade,
  prompt_id uuid not null references prompts(id),
  chosen_at timestamptz not null default now(),
  completed_at timestamptz,
  skipped boolean not null default false
);

-- Pod Notes
create table if not exists pod_notes (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  status text not null default 'published' check (status in ('published', 'held', 'hidden')),
  created_at timestamptz not null default now()
);

-- Appreciations (Seen Cards)
create table if not exists appreciations (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  meetup_id uuid not null references meetups(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 10 and 200),
  status text not null default 'submitted' check (status in ('submitted', 'held', 'hidden')),
  created_at timestamptz not null default now(),
  check (author_id <> recipient_id),
  unique (meetup_id, author_id, recipient_id)
);

-- Blocks
create table if not exists blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Safety Reports
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

-- Feedback
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references meetups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  looked_forward smallint check (looked_forward between 1 and 5),
  felt_safe smallint check (felt_safe between 1 and 5),
  felt_included smallint check (felt_included between 1 and 5),
  would_return boolean,
  free_text text,
  share_with_host boolean not null default false,
  created_at timestamptz not null default now(),
  unique (meetup_id, user_id)
);

-- Closing Choices
create table if not exists closing_choices (
  user_id uuid references profiles(id) on delete cascade,
  pod_id uuid references pods(id) on delete cascade,
  choice text not null check (choice in ('keep', 'community', 'part')),
  created_at timestamptz not null default now(),
  primary key (user_id, pod_id)
);

-- Wave Feedback
create table if not exists wave_feedback (
  user_id uuid references profiles(id) on delete cascade,
  pod_id uuid references pods(id) on delete cascade,
  connected_end smallint check (connected_end between 1 and 5),
  made_friend text check (made_friend in ('yes', 'maybe', 'no')),
  free_text text,
  created_at timestamptz not null default now(),
  primary key (user_id, pod_id)
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  channel text not null default 'email' check (channel in ('email', 'whatsapp_link')),
  template_key text not null,
  reason_text text not null check (char_length(reason_text) > 0),
  local_date date not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped'))
);
create unique index if not exists one_routine_notification_per_day
on notifications(user_id, local_date) where kind <> 'safety';

-- Host Tasks
create table if not exists host_tasks (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references profiles(id),
  pod_id uuid references pods(id),
  user_id uuid references profiles(id),
  kind text not null check (kind in (
    'reminder', 'followup', 'reschedule', 'late', 'withdrawal', 'screening', 'moderation', 'safety'
  )),
  body text not null,
  due_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

-- Games
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  players_min smallint,
  players_max smallint,
  rules_summary text not null,
  source_note text,
  verified boolean not null default false,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  check (verified = false or (verified_by is not null and verified_at is not null))
);

-- Waypoints (N17: public, daytime, verified, staffed or host-attended)
create table if not exists waypoints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text,
  is_public boolean not null check (is_public),
  staffed boolean not null default false,
  host_attended boolean not null default false,
  safety_notes text,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  active boolean not null default false,
  check (staffed or host_attended),
  check (active = false or (verified_by is not null and verified_at is not null))
);

-- Bounties (N17: group min >= 4, starts 07:00-18:30 IST)
create table if not exists bounties (
  id uuid primary key default gen_random_uuid(),
  waypoint_id uuid not null references waypoints(id),
  title text not null,
  description text not null,
  group_min smallint not null default 4 check (group_min >= 4),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  host_contact text not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Bounty Joins
create table if not exists bounty_joins (
  bounty_id uuid references bounties(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (bounty_id, user_id)
);

-- Passport Stamps
create table if not exists passport_stamps (
  pod_id uuid references pods(id) on delete cascade,
  waypoint_id uuid references waypoints(id),
  stamped_at timestamptz not null default now(),
  confirmed_by uuid not null references profiles(id),
  primary key (pod_id, waypoint_id)
);

-- Taranga Events
create table if not exists taranga_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  blurb text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  place_name text not null,
  capacity int,
  signup_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Event Interest
create table if not exists event_interest (
  event_id uuid references taranga_events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  attended_at timestamptz,
  marked_by uuid references profiles(id),
  primary key (event_id, user_id)
);

-- Event Log (props never contains letter/note text)
create table if not exists event_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  pod_id uuid,
  name text not null,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Audit Log
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text,
  entity_id text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7.2 Functions and Triggers
-- ============================================================================

create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('host', 'admin'), false)
$$;

create or replace function public.is_pod_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pod_members
    where pod_id = p and user_id = auth.uid() and left_at is null
  )
$$;

create or replace function public.is_pod_host(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'admin', false)
  or exists (select 1 from pods where id = p and host_id = auth.uid())
$$;

create or replace function public.meetup_pod(m uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select pod_id from meetups where id = m
$$;

create or replace function public.blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;

create or replace function public.is_blocked_pair(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.blocked_between(auth.uid(), other)
$$;

create or replace function public.next_local_hour(ts timestamptz, hr int)
returns timestamptz language sql stable as $$
  select case
    when (ts at time zone 'Asia/Kolkata')::time < make_time(hr, 0, 0)
    then (date_trunc('day', ts at time zone 'Asia/Kolkata') + make_interval(hours => hr)) at time zone 'Asia/Kolkata'
    else (date_trunc('day', ts at time zone 'Asia/Kolkata') + interval '1 day' + make_interval(hours => hr)) at time zone 'Asia/Kolkata'
  end
$$;

create or replace function public.letter_visible_to(
  v uuid, p_pod uuid, p_author uuid, p_seq smallint, p_submitted timestamptz, p_status text
)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  my_sub timestamptz;
  my_hour int;
begin
  if v is null or p_status <> 'submitted' then return false; end if;
  if not exists (select 1 from pod_members where pod_id = p_pod and user_id = v and left_at is null) then
    return false;
  end if;
  if public.blocked_between(v, p_author) then return false; end if;
  select submitted_at into my_sub from letters
  where pod_id = p_pod and author_id = v and seq = p_seq and status in ('submitted', 'held');
  if my_sub is null then return false; end if;
  select letter_hour into my_hour from profiles where id = v;
  return now() >= public.next_local_hour(greatest(p_submitted, my_sub), my_hour);
end $$;

create or replace function public.can_read_letter(
  p_pod uuid, p_author uuid, p_seq smallint, p_submitted timestamptz, p_status text
)
returns boolean language sql stable security definer set search_path = public as $$
  select public.letter_visible_to(auth.uid(), p_pod, p_author, p_seq, p_submitted, p_status)
$$;

create or replace function public.can_read_appreciation(
  p_recipient uuid, p_meetup uuid, p_status text
)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  ends timestamptz;
  hr int;
begin
  if auth.uid() is null or auth.uid() <> p_recipient or p_status <> 'submitted' then
    return false;
  end if;
  select ends_at into ends from meetups where id = p_meetup;
  select letter_hour into hr from profiles where id = p_recipient;
  return ends is not null and now() >= public.next_local_hour(ends, hr);
end $$;

create or replace function public.can_see_events() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1 from pod_members pm join pods p on p.id = pm.pod_id
    where pm.user_id = auth.uid() and p.status in ('closing', 'closed')
  )
$$;

create or replace function public.pod_capacity_guard() returns trigger
language plpgsql as $$
declare
  cap int;
  cnt int;
begin
  select capacity into cap from pods where id = new.pod_id for update;
  select count(*) into cnt from pod_members where pod_id = new.pod_id and left_at is null;
  if cnt >= cap then raise exception 'pod is full'; end if;
  return new;
end $$;

create or replace trigger trg_pod_capacity before insert on pod_members
for each row execute function public.pod_capacity_guard();

create or replace function public.bounties_guard() returns trigger language plpgsql as $$
declare
  w record;
  s time;
  e time;
begin
  select * into w from waypoints where id = new.waypoint_id;
  if w.id is null or w.active is not true then
    raise exception 'waypoint must be active and verified';
  end if;
  s := (new.starts_at at time zone 'Asia/Kolkata')::time;
  e := (new.ends_at at time zone 'Asia/Kolkata')::time;
  if (new.starts_at at time zone 'Asia/Kolkata')::date <> (new.ends_at at time zone 'Asia/Kolkata')::date then
    raise exception 'bounty must start and end on the same day';
  end if;
  if s < time '07:00' or e > time '18:30' then
    raise exception 'bounty must run within 07:00-18:30 IST';
  end if;
  if new.status = 'open' then
    if tg_op = 'INSERT' or old.status is distinct from 'open' then
      if new.starts_at < now() + interval '24 hours' then
        raise exception 'bounty must be opened at least 24 hours before it starts';
      end if;
    end if;
  end if;
  return new;
end $$;

create or replace trigger trg_bounties_guard before insert or update on bounties
for each row execute function public.bounties_guard();

-- ============================================================================
-- 7.3 Row Level Security
-- ============================================================================

do $$ declare t text; begin
  for t in select unnest(array[
    'profiles', 'consents', 'screenings', 'venues', 'cycles', 'pods',
    'pod_members', 'prompts', 'letters', 'meetups', 'rsvps', 'attendance', 'payments_mock',
    'stretch_choices', 'pod_notes', 'appreciations', 'blocks', 'safety_reports', 'feedback',
    'closing_choices', 'wave_feedback', 'notifications', 'host_tasks', 'games', 'waypoints',
    'bounties', 'bounty_joins', 'passport_stamps', 'taranga_events', 'event_interest',
    'event_log', 'audit_log'
  ]) loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

create policy p_profiles on profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

create policy p_consents on consents for select to authenticated
  using (user_id = auth.uid());

create policy p_screenings on screenings for select to authenticated
  using (public.is_staff());

create policy p_venues on venues for select to authenticated
  using (active or public.is_staff());

create policy p_cycles on cycles for select to authenticated
  using (true);

create policy p_pods on pods for select to authenticated
  using (public.is_pod_member(id) or public.is_pod_host(id));

create policy p_pod_members on pod_members for select to authenticated
  using (public.is_pod_member(pod_id) or public.is_pod_host(pod_id));

create policy p_prompts on prompts for select to authenticated
  using (active or public.is_staff());

create policy p_letters on letters for select to authenticated
  using (
    author_id = auth.uid()
    or public.can_read_letter(pod_id, author_id, seq, submitted_at, status)
    or public.is_pod_host(pod_id)
  );

create policy p_meetups on meetups for select to authenticated
  using (public.is_pod_member(pod_id) or public.is_pod_host(pod_id));

create policy p_rsvps on rsvps for select to authenticated
  using (user_id = auth.uid() or public.is_pod_host(public.meetup_pod(meetup_id)));

create policy p_attendance on attendance for select to authenticated
  using (user_id = auth.uid() or public.is_pod_host(public.meetup_pod(meetup_id)));

create policy p_stretch on stretch_choices for select to authenticated
  using (user_id = auth.uid());

create policy p_notes on pod_notes for select to authenticated
  using (
    author_id = auth.uid()
    or public.is_pod_host(pod_id)
    or (status = 'published' and public.is_pod_member(pod_id) and not public.is_blocked_pair(author_id))
  );

create policy p_appreciations on appreciations for select to authenticated
  using (
    author_id = auth.uid()
    or public.can_read_appreciation(recipient_id, meetup_id, status)
  );

create policy p_blocks on blocks for select to authenticated
  using (blocker_id = auth.uid());

create policy p_reports on safety_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_staff());

create policy p_feedback on feedback for select to authenticated
  using (user_id = auth.uid());

create policy p_closing on closing_choices for select to authenticated
  using (user_id = auth.uid());

create policy p_wavefb on wave_feedback for select to authenticated
  using (user_id = auth.uid());

create policy p_notifications on notifications for select to authenticated
  using (user_id = auth.uid());

create policy p_tasks on host_tasks for select to authenticated
  using (host_id = auth.uid() or public.app_role() = 'admin');

create policy p_games on games for select to authenticated
  using (verified or public.is_staff());

create policy p_waypoints on waypoints for select to authenticated
  using (active or public.is_staff());

create policy p_bounties on bounties for select to authenticated
  using (status = 'open' or public.is_staff());

create policy p_bounty_joins on bounty_joins for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

create policy p_stamps on passport_stamps for select to authenticated
  using (public.is_pod_member(pod_id) or public.is_staff());

create policy p_events on taranga_events for select to authenticated
  using ((status = 'published' and public.can_see_events()) or public.is_staff());

create policy p_event_interest on event_interest for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- ============================================================================
-- 7.4 Views and Grants
-- ============================================================================

create or replace view v_pod_roster as
select pm.pod_id, p.id as user_id, p.display_name
from pod_members pm join profiles p on p.id = pm.user_id
where pm.left_at is null and public.is_pod_member(pm.pod_id)
and not public.is_blocked_pair(p.id);

create or replace view v_feedback_agg as
select mt.id as meetup_id, mt.pod_id, count(*) as responses,
round(avg(f.looked_forward), 2) as avg_looked_forward,
round(avg(f.felt_safe), 2) as avg_felt_safe,
round(avg(f.felt_included), 2) as avg_felt_included,
count(*) filter (where f.would_return) as would_return_yes
from feedback f join meetups mt on mt.id = f.meetup_id
where public.is_pod_host(mt.pod_id)
group by mt.id, mt.pod_id;

-- Metric Views (Section 10)
create or replace view m_funnel as
select status, count(*) as people from profiles where role = 'member' group by status;

create or replace view m_table_attendance as
select mt.id as meetup_id, mt.pod_id, mt.seq, mt.status,
(select count(*) from rsvps r where r.meetup_id = mt.id and r.response = 'yes') as yes_count,
(select count(*) from attendance a where a.meetup_id = mt.id) as attended
from meetups mt;

create or replace view m_hours_together as
select pod_id, round(sum(extract(epoch from (ends_at - starts_at))) / 3600.0, 2) as hours
from meetups where status = 'done' group by pod_id;

create or replace view m_letters as
select pod_id,
count(*) filter (where seq = 1) as letter1,
count(*) filter (where seq = 2) as letter2,
count(*) filter (where seq = 3) as letter3
from letters group by pod_id;

create or replace view m_arm_compare as
select p.arm, p.opener_arm, count(distinct p.id) as pods, count(*) as responses,
round(avg(f.felt_included), 2) as avg_included,
round(avg(f.looked_forward), 2) as avg_looked_forward,
count(*) filter (where f.would_return) as would_return_yes
from feedback f join meetups mt on mt.id = f.meetup_id join pods p on p.id = mt.pod_id
group by p.arm, p.opener_arm;

create or replace view m_connected as
select count(*) as people, round(avg(p.connected_start), 2) as avg_start,
round(avg(w.connected_end), 2) as avg_end
from wave_feedback w join profiles p on p.id = w.user_id
where p.connected_start is not null and w.connected_end is not null;

create or replace view m_graduation as
select choice, count(*) as people from closing_choices group by choice;

create or replace view m_event_funnel as
select e.id as event_id, e.title, count(i.user_id) as interested,
count(i.attended_at) as attended
from taranga_events e left join event_interest i on i.event_id = e.id
group by e.id, e.title;

-- Grants
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
grant select on all tables in schema public to authenticated;
revoke insert, update, delete, truncate on all tables in schema public from authenticated;
revoke all on payments_mock, event_log, audit_log from authenticated;
grant select on v_pod_roster, v_feedback_agg to authenticated;

revoke all on m_funnel, m_table_attendance, m_hours_together, m_letters, m_arm_compare,
m_connected, m_graduation, m_event_funnel from anon, authenticated;

-- Core functions must not be callable by app roles
revoke execute on function public.blocked_between(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.letter_visible_to(uuid, uuid, uuid, smallint, timestamptz, text)
from public, anon, authenticated;
