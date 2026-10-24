# Taranga Tables: Prototype Master Spec v0.2 (Pilot-First)

Prepared 21 October 2026 for Varun and the Taranga team. Status: PROVISIONAL.
Nothing here is a decision until your team approves it.

## 0. How to use this document

1. Save this whole file as SPEC.md in the root of an empty repo.
2. Paste the block in Section 13 into Antigravity (or Replit Agent) as the first message. It tells the agents to read SPEC.md first and build phase by phase.
3. Labels used throughout: [EVIDENCE] = I opened the source; [REPORTED] = stated in the research reports, not independently opened; [INFERENCE] = reasoned from evidence; [HYPOTHESIS] = to be tested; [JUDGMENT] = a default I chose; [DECISION NEEDED] = the team must choose before launch.
4. Scope guard: this prototype exists to run a 4-week pilot in Mysuru (2 pods of 6 people). It is not built to scale. Anything not needed for that pilot is out of scope (Section 11.3).

---

## 1. The idea

### 1.1 One-liner
Instagram shows you other people's lives. Taranga Tables gets you a seat at a real table, with the same five people, again and again.

### 1.2 Core promise
Six strangers. Four weeks. One table, again and again.

### 1.3 Why this shape (honest version)
- Friendship takes repeated time together. Hall (2018) estimates roughly 40-60 hours for a casual friend, 80-100 for a friend and 200+ for a close friend, from 355 adults plus 112 freshmen. It is correlational and self-reported [EVIDENCE, KU summary opened]. One dinner cannot reach those hours. [INFERENCE] The product's job is the gap between tables.
- Loneliness is common. WHO reports about 1 in 6 people worldwide, and about 1 in 5 among adolescents and young adults [EVIDENCE, WHO page opened]. No Mysuru or Tier-2 figure exists [UNKNOWN].
- No hormone claims. Oxytocin-trust findings have been criticised and have failed replications, and no evidence shows an app can release oxytocin in a way that builds friendship [REPORTED]. 'Oxytocin vs dopamine' is a brand story, not a mechanism. Never use it in UI copy, store listings or investor decks.
- North Star metric: shared offline hours between the same people. Anti-metric: minutes spent in the app.

### 1.4 Creative concept: The Wave
Taranga means wave. Every pod lives through one four-week Wave.

| Stage | Days | What happens | Design idea |
|---|---|---|---|
| Ripple | 0-2 | Sign up, consent, 3-question check-in, pick evenings | 'Choose your evenings', not 'build a profile'. No photo required. |
| Letters | 2-9 | Each person writes up to 3 short letters to their pod, each slightly deeper. Others' letters unlock only after you write yours. | Slow delivery, reciprocity, no feed. |
| First Table | 7-14 | 90 minutes at a public cafe. A Taranga host is present. Phones in a basket, prompt cards, one shared task. | Meeting within 7-14 days of signup is a target [HYPOTHESIS]. |
| Between Tables | 14-28 | Optional 'Stretch' card (3 levels), a shared pod note | Opt-in discomfort. Skipping costs nothing. |
| Tables 2 and 3 | weekly (default) | Same people, same host, same venue if possible | Cadence is unknown. [DECISION NEEDED] weekly vs fortnightly. |
| Closing | day 28 | 'Keep the Table': continue self-hosted, join Strangers & Co, or part kindly. 2-minute feedback. | Graduation by design. |

### 1.5 Signature mechanics
1. **Write-to-unlock letters.** You cannot read the pod's letters until you have written yours. Delivery happens once a day at a time you choose (default 8:00 pm). Reciprocity, not scrolling.
2. **The Closing Screen.** After today's letter the app says: 'That's everything for today. Your next letter arrives at 8:00 pm tomorrow.' Nothing else to tap.
3. **Hours Together ledger.** A pod-level progress ring counting confirmed in-person hours (host check-in). Milestones at 5, 10, 25 and 50 hours are decorative markers we chose [JUDGMENT]. Footnote: 'Research suggests friendships take many shared hours. This is a rough guide, not a rule.'
4. **Phone basket.** A physical ritual at every table, with one line of host copy.
5. **Table Cards, 3 levels.** Light, Real, Deep. The pod picks the level together at each table. Nobody is pushed deeper.
6. **Pod name.** The pod names itself at Table 1. Cheap belonging.
7. **Kind Exit.** Leaving has a no-shame path, and the host follows up personally.
8. **Human host, not nudges.** A person reminds you; the app does not nag.

### 1.6 What we will not build
Swiping, browsing other people, an infinite feed, streaks, points, leaderboards, variable-reward notifications, fake activity or scarcity, guilt copy, AI 'friends', AI-written letters, in-app 1:1 chat in the prototype, location sharing, or any therapeutic claim.

### 1.7 Working names
Taranga Tables (default), Slow Table, Sangama, Ripple. [DECISION NEEDED]. Wherever the name appears, show 'A Taranga project' and say plainly that the app leads to Taranga events.

---

## 2. Evidence ledger (what the design stands on)

| # | Claim | Label | Design consequence |
|---|---|---|---|
| E1 | Friendship hours: roughly 40-60 / 80-100 / 200+ (Hall 2018) | EVIDENCE, correlational | Fixed pods, repeated tables, Hours Together ledger |
| E2 | Free events: 28% median no-show vs 17% paid, across 1,070+ mostly conference events; Basecamp $100 refundable deposit gave 50 of 55 attending vs 38 of 84 at its free event | EVIDENCE, narrow (US business events, one small test) | Test a refundable deposit arm vs a free arm; do not assume it transfers |
| E3 | WHO: 1 in 6 lonely, youth about 1 in 5 | EVIDENCE | Market framing only |
| E4 | Hormone and 'dopamine hijack' framing unsupported | REPORTED by both reports | No hormone language |
| E5 | Active vs passive social media use: mostly negligible associations with wellbeing | REPORTED | Do not sell 'passive scrolling is toxic'; remove the feed because it adds no value to our goal |
| E6 | Self-chosen goals beat assigned goals for phone reduction (abstract only) | REPORTED | User sets letter time, cadence preference and Stretch level |
| E7 | Streaks work through controlled motivation and can cause anxiety | REPORTED, secondary | No streaks |
| E8 | Online-delivered if-then plans had a null effect in an alcohol meta-analysis | EVIDENCE, off-topic | Do not rely on app prompts for attendance. A/B test against a human host reminder. |
| E9 | Choice overload raises perceived overload; harm to wellbeing is mixed | REPORTED | No browsing; pods are assigned |
| E10 | DPDP s9(1) needs verifiable parental consent for children; CCPA dark-pattern guidelines list 13 patterns | REPORTED, official text not opened by me | 18+ only; design review against all 13 patterns |
| U1 | Second-meeting rate for stranger pods | UNKNOWN | The pilot's main metric |
| U2 | Mysuru willingness to pay, women's safety outcomes, venue revenue share | UNKNOWN | Pilot questions |

---

## 3. Blueprint: states, journey, rules

### 3.1 State machines
- **User status**: `onboarding` > `screened` > `waitlisted` > `in_pod` > `completed`. Side exits from any state: `withdrawn`, `removed`.
- **Pod status**: `forming` > `letters` > `tables` > `closing` > `closed`. Side exit: `cancelled`.
- **Letter status**: `draft` > `submitted` > `published` (after `publish_at` and after the reader has submitted). Side exit: `hidden` (moderation).
- **RSVP deposit status**: `none` | `pending` | `held` | `refunded` | `forfeited`. In the prototype, payments are mocked; Razorpay test mode is optional behind an adapter.

### 3.2 Day-by-day journey (member)
1. **Day 0**: Land on a plain page that says what this is, who runs it (Taranga) and what it costs. Sign up by email OTP.
2. **Onboarding (under 4 minutes)**: First name or handle, age-18+ declaration through the AgeAssurance adapter, languages, up to 5 interests, two comfort sliders, evenings available, 'women-only pod' option, coarse neighbourhood. Then three separate consent toggles (service, safety check-in, WhatsApp contact).
3. **Check-in (3 questions, wording approved by a clinical advisor [DECISION NEEDED])**: Result is stored only as a band. If elevated, show a kind message with helpline details and hold the person from pod placement until the host calls.
4. **Waitlist**: The host runs matching, reviews and confirms a pod of 5-7.
5. **Pod revealed by first names only**: The pod letter prompt for Day 2 appears. Write-to-unlock begins.
6. **Table 1 invitation**: With venue, time, what to expect, a safety page and an RSVP. Arm B only: deposit step with plain refund terms.
7. **At the table**: The host checks people in. Phones go in the basket. Table Cards at the chosen level. A shared task. The pod names itself.
8. **Between tables**: One optional Stretch card. A pod note space (text only, 500 characters, host-moderated).
9. **Tables 2 and 3**: Same flow, shorter onboarding.
10. **Day 28: Closing**: Three options plus feedback.

### 3.3 Design Constitution (build-time rules, each testable)
- **R1**: At most one content screen per day per user. The letter reveal is that screen.
- **R2**: Every session ends on the Closing Screen. No 'you might also like'.
- **R3**: No streaks, points, badges for activity, rankings or comparison between users.
- **R4**: Write-to-unlock. A user can always see their own letters.
- **R5**: Pods are locked for the Wave. No self-service rematching. Only the host can move someone (safety or comfort).
- **R6**: Stretch cards are opt-in and skippable. Copy never implies failure.
- **R7**: Copy is neutral. Banned: 'you're missing out', 'last chance', 'don't let your pod down', 'X people are waiting'.
- **R8**: Progress measures are pod-level and offline-hour based, never time in app.
- **R9**: At most one notification per day, at the time the user chose, always saying why it was sent. No variable timing.
- **R10**: Show who runs the app and where it leads (Taranga events) on landing, onboarding and the Closing page.
- **R11**: Leaving and deleting data is one tap each, with no friction screens or guilt.
- **R12**: Deposits: never pre-ticked, refund terms shown before payment, and refund completes automatically on check-in.

CCPA dark-pattern check: false urgency, basket sneaking, confirm shaming, forced action, subscription trap, interface interference, bait and switch, drip pricing, disguised advertisement, nagging, trick wording, SaaS billing and rogue malware are each listed in the QA checklist (Section 9.5).

---

## 4. System architecture

### 4.1 Principles
One codebase, one database, no microservices, no paid third-party analytics. Everything external sits behind an adapter interface with a mock implementation so the prototype runs with zero credentials.

### 4.2 Stack [JUDGMENT, chosen for Varun's TypeScript/SQL skills]
- **Web app**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, installable PWA. Mobile-first (360px baseline).
- **Database and auth**: Supabase Postgres, Row Level Security, email OTP auth. Choose an India (Mumbai) region if available; verify.
- **Jobs**: Supabase pg_cron or Vercel Cron calling secured route handlers (Letter delivery, reminders, wave close).
- **Email**: Resend adapter, console mock by default.
- **WhatsApp**: Prototype: host-assisted. App generates a prefilled wa.me link and message template per member. Production: WhatsApp Cloud API adapter (stub only). Keep email as fallback.
- **Payments**: PaymentProvider adapter: MockProvider (default), RazorpayTestProvider (optional). No live money in prototype.
- **Age assurance**: AgeAssurance adapter: SelfDeclaredStub (default). Throws a visible banner: NOT COMPLIANT FOR PRODUCTION.
- **Moderation**: KeywordModerator (default), optional LLM adapter off by default. Flags go to host queue, never auto-delete.
- **Analytics**: event_log table + SQL views. No third-party trackers.
- **Hosting**: Vercel or Replit deployment; Supabase cloud.

### 4.3 Diagram (text)
```
[Member PWA]   [Host Console]
      \             /
Next.js route handlers + server actions
  |            |            |
Adapters: Payment | Age | Email/WhatsApp | Moderation
  |
Supabase Postgres (RLS) <- Cron jobs (letters, reminders, close)
  |
event_log + metric views -> Host Console metrics page
```

### 4.4 Repository structure
- `/app` (member routes), `/app/host` (host console), `/app/api` (route handlers)
- `/lib/adapters/{payments,age,notify,moderation}`
- `/lib/matching`, `/lib/letters`, `/lib/metrics`
- `/supabase/migrations`, `/supabase/seed.sql`
- `/tests` (unit + e2e), `/docs` (SPEC.md, DECISIONS.md, RUNBOOK.md)

### 4.5 Non-functional requirements
Mobile-first and keyboard accessible (WCAG AA contrast), English plus Kannada string files (all copy in `/locales/en.json` and `/locales/kn.json`, Kannada values may start as English placeholders), page load under 3 seconds on a mid-range phone on 4G [JUDGMENT], all dates in Asia/Kolkata, no secrets in code, every adapter swappable by environment variable, migrations reproducible from scratch.

---

## 5. Data model

Data minimisation: no date of birth, no phone number, no precise location, no raw screening answers.

```sql
create extension if not exists pgcrypto;

create type user_status as enum
('onboarding','screened','waitlisted','in_pod','completed','withdrawn','removed');
create type pod_status as enum
('forming','letters','tables','closing','closed','cancelled');
create type deposit_status as enum
('none','pending','held','refunded','forfeited');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  role text not null default 'member' check (role in ('member','host','admin')),
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

create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  purpose text not null check (purpose in ('core_service','safety_checkin','whatsapp_contact','content_photos')),
  notice_version text not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create table screenings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  instrument_version text not null,
  band text not null check (band in ('none','mild','elevated')),
  helpline_shown boolean not null default false,
  host_followup_done boolean not null default false,
  created_at timestamptz not null default now()
);

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null, area text, public_place boolean not null default true,
  capacity int, contact text
);

create table cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null, starts_on date not null, ends_on date not null
);

create table pods (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references cycles(id),
  name text, status pod_status not null default 'forming',
  women_only boolean not null default false,
  capacity smallint not null default 6 check (capacity between 5 and 7),
  arm text not null default 'free' check (arm in ('free','deposit')),
  deposit_inr int not null default 0 check (deposit_inr >= 0),
  host_id uuid references profiles(id),
  default_venue_id uuid references venues(id),
  created_at timestamptz not null default now()
);

create table pod_members (
  pod_id uuid references pods(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz, left_reason text,
  primary key (pod_id, user_id)
);
create unique index one_active_pod_per_user on pod_members(user_id) where left_at is null;

create table prompts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('letter','table','stretch')),
  level smallint not null check (level between 1 and 3),
  body_en text not null, body_kn text, active boolean not null default true
);

create table letters (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid not null references prompts(id),
  seq smallint not null check (seq between 1 and 3),
  body text not null check (char_length(body) between 20 and 1200),
  status text not null default 'submitted' check (status in ('draft','submitted','published','hidden')),
  moderation_flag text,
  submitted_at timestamptz not null default now(),
  unique (pod_id, author_id, seq)
);

create table letter_reads (
  letter_id uuid references letters(id) on delete cascade,
  reader_id uuid references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (letter_id, reader_id)
);

create table meetups (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  seq smallint not null,
  starts_at timestamptz not null, ends_at timestamptz not null,
  venue_id uuid references venues(id),
  status text not null default 'scheduled' check (status in ('scheduled','done','cancelled')),
  unique (pod_id, seq)
);

create table rsvps (
  meetup_id uuid references meetups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  response text not null check (response in ('yes','no','maybe')),
  deposit deposit_status not null default 'none',
  payment_ref text,
  responded_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

create table attendance (
  meetup_id uuid references meetups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  marked_by uuid references profiles(id),
  primary key (meetup_id, user_id)
);

create table stretch_choices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  pod_id uuid not null references pods(id) on delete cascade,
  prompt_id uuid not null references prompts(id),
  chosen_at timestamptz not null default now(),
  completed_at timestamptz, skipped boolean not null default false
);

create table pod_notes (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references pods(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 500),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);

create table blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  pod_id uuid references pods(id), meetup_id uuid references meetups(id),
  subject_user_id uuid references profiles(id),
  severity text not null check (severity in ('low','medium','high')),
  category text not null, body text,
  status text not null default 'open' check (status in ('open','in_review','resolved')),
  resolution text,
  created_at timestamptz not null default now(), resolved_at timestamptz
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references meetups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  felt_safe smallint check (felt_safe between 1 and 5),
  felt_included smallint check (felt_included between 1 and 5),
  would_return boolean, free_text text,
  created_at timestamptz not null default now(),
  unique (meetup_id, user_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null, channel text not null check (channel in ('email','whatsapp_link')),
  template_key text not null, reason_text text not null,
  scheduled_for timestamptz not null, sent_at timestamptz,
  status text not null default 'queued' check (status in ('queued','sent','failed','skipped'))
);

create table event_log (
  id bigint generated always as identity primary key,
  user_id uuid, pod_id uuid, name text not null, props jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid, action text not null, entity text, entity_id text,
  created_at timestamptz not null default now()
);
```

### 5.1 Row Level Security (required, tested)
- Members read and write only their own profile, consents, screenings (read band only), rsvps, stretch_choices and feedback.
- Members read pod_members, meetups and published pod_notes only for their own active pod, and see display_name and nothing else about other members.
- Letters: a member can always read their own. They can read other pod members' letters of seq N only if they have a submitted letter of seq N in the same pod. Enforce in a SQL view or policy, not only in the UI.
- Blocked pairs never see each other's letters or notes. The host is notified and rematching is manual.
- Host reads pods they host, their members' names, attendance, aggregated feedback, and the safety queue. Hosts never see raw free_text feedback attributed to a user unless the user ticks 'share with host'. [DECISION NEEDED] whether to offer that.
- Admin reads everything and every admin read of a member record writes to audit_log.
- Screenings and safety_reports are never exposed to other members.

---

## 6. Matching spec

The host runs matching for the waitlist. The algorithm only suggests; the host confirms or edits. No automated placement in the prototype.

### 6.1 Hard constraints
1. `is_18_plus` is true and status is waitlisted.
2. Not an elevated screening band, unless `host_followup_done` is true.
3. At least 2 shared availability slots with every other pod member (same weekday, same part of day).
4. At least one shared language with every other pod member.
5. `women_only` pods contain only members who selected the women-only option. A member who wants women-only is never placed in a mixed pod. Mixed pods must not have exactly one woman. [JUDGMENT]
6. No blocked pair in the same pod.
7. Pod size 5 to 7, default 6.

### 6.2 Soft score (higher is better) [JUDGMENT, tune after the pilot]
```
score(pod) = 3 * avg_pairwise_shared_interests_capped_at_2
           + 2 * (diversity of comfort sliders: stddev between 0.6 and 1.4)
           + 1 * area_proximity
           - 5 * (two or more members from the same college or workplace, if provided)
```
Rationale [INFERENCE]: 1-2 shared interests give a first conversation; too many makes a clique; mixed comfort levels give balance. Treat all weights as untested.

### 6.3 Procedure
1. Filter by hard constraints into candidate groups.
2. Greedy build: seed with the longest-waiting member, add the best-scoring compatible member until the pod reaches capacity, then try single swaps to improve score.
3. Output a ranked list of suggested pods with a plain-language 'why these people' line per pod (shared interests, shared evenings, language).
4. Host approves, edits or rejects. Every change writes to audit_log.
5. Unplaced members stay waitlisted with a kind status message and an expected timeframe the host sets.

---

## 7. API routes and scheduled jobs

All handlers: validate input with zod, check the session role, return typed errors, write a name-only row to event_log (never message text), and write admin or host reads of member data to audit_log.

### 7.1 Member routes
| Method and path | Purpose | Key rules |
|---|---|---|
| POST /api/onboarding | Save profile | interests at most 5; call AgeAssurance adapter; store is_18_plus only, no DOB |
| POST /api/consents | Record or withdraw consent for one purpose | One call per purpose; never bundled; versioned notice |
| POST /api/checkin | Submit the 3 check-in answers | Compute band server-side, store band only, discard answers, return helpline flag |
| GET /api/me/pod | Pod, first names, next meetup, Hours Together | Names only; no other profile fields |
| GET /api/letters/current | Today's prompt, own letter state, unlocked letters | Unlock rule in 7.3 |
| POST /api/letters | Submit letter number N | 20-1200 chars; moderation; one per N |
| POST /api/letters/:id/read | Mark read | |
| POST /api/rsvp | yes, no or maybe | If pod.arm is deposit and response is yes, call PaymentProvider.createHold |
| POST /api/stretch | Choose, skip or complete a Stretch card | Skip has no penalty and no follow-up nag |
| POST /api/notes | Pod note | 500 chars; moderated |
| POST /api/report | Safety report | Always reachable from every screen; high severity emails the host instantly |
| POST /api/block | Block a pod member | Notifies host, not the blocked person |
| POST /api/feedback | Post-table feedback | Anonymous to peers |
| POST /api/me/withdraw | Leave the pod kindly | Host gets a prompt to follow up personally |
| GET /api/me/export | Download my data as JSON | |
| DELETE /api/me | Delete my account and personal data | Immediate; event_log rows are anonymised (user_id set to null) |

### 7.2 Host routes (role host or admin)
| Method and path | Purpose |
|---|---|
| GET /api/host/waitlist | Waitlisted members with status flags (never check-in answers) |
| POST /api/host/match/suggest | Run the Section 6 suggestions |
| POST /api/host/pods | Create or confirm a pod; set arm (free or deposit) |
| POST /api/host/pods/:id/meetups | Schedule meetups 1 to 3 |
| POST /api/host/meetups/:id/checkin | Mark attendance; triggers deposit refund |
| POST /api/host/meetups/:id/close | Mark done; apply no-show policy [DECISION NEEDED] |
| POST /api/host/move-member | Move or remove a member with a reason |
| GET /api/host/safety-queue and POST /api/host/safety/:id/resolve | Safety workflow |
| POST /api/host/screenings/:id/followup | Record that the host phoned an elevated-band person |
| POST /api/host/whatsapp-links | Generate prefilled wa.me links and message templates per member |
| GET /api/host/metrics | Pilot dashboard data (Section 10) |

### 7.3 Letter unlock rule (implement as a SQL view or RLS policy)
Reader U may see letter L (author A, seq N, same pod) only if: A is not U, L is not hidden, U has a submitted letter with seq N in the same pod, neither user has blocked the other, and now is at or after the reveal time. Reveal time is the next occurrence of U's letter_hour (Asia/Kolkata) after the later of L.submitted_at and U's own seq N submitted_at. This gives a slow, reciprocal rhythm without a feed.

### 7.4 Scheduled jobs
| Job | When | What |
|---|---|---|
| queue_letter_notifications | hourly | One email per user per day at their letter_hour if something new unlocked; reason text included ('You're getting this because your pod has a new letter') |
| table_reminders | 24 hours and 3 hours before each meetup | Email plus a host task to send a personal WhatsApp reminder |
| close_wave | day 28 | Set pod to closing; send the Closing invitation |
| refresh_metrics | nightly | Refresh the metric views |
| purge | daily | Delete screenings and notifications past retention [DECISION NEEDED; default 90 days after cycle end] |

---

## 8. Screens, copy and visual direction

### 8.1 Member screens
- **M1 Landing**: One-liner, who runs it, price, what happens in 4 weeks, safety summary, 'A Taranga project'
- **M2 Sign in**: Email OTP
- **M3 Onboarding stepper**: 6 steps, progress bar, back button always works
- **M4 Consents**: Three separate toggles, each with a plain-language reason, none pre-ticked
- **M5 Check-in**: 3 questions, calm tone, not scored visibly
- **M6 Waitlist**: Honest status; no fake position counters
- **M7 Pod home**: Pod name, first names, Hours Together ring, next table, today's letter state
- **M8 Write letter**: Prompt, text box with a gentle character guide, save draft
- **M9 Letter reveal**: Letters of the pod one by one, then the Closing Screen
- **M10 Table invite and RSVP**: Venue, time, what to expect, safety info; deposit step on the deposit arm
- **M11 Table day**: Host name and number, venue, what to bring, a 'I'm running late' button
- **M12 Stretch**: 3 cards at the chosen level; skip is equal in size to accept
- **M13 Pod notes**: Text only, host-moderated
- **M14 Closing and feedback**: Keep the Table, Join Strangers & Co, or Part kindly; 2-minute feedback
- **M15 Settings and help**: Letter time, withdraw, export, delete, report, block, helpline

A 'Help and report' button is visible on every member screen.

### 8.2 Host console screens
H1 Waitlist, H2 Match suggestions, H3 Pod detail, H4 Meetup scheduler, H5 Check-in (large tap targets, usable on a phone in a cafe), H6 Safety queue, H7 Check-in follow-ups, H8 Pilot metrics, H9 WhatsApp message helper.

### 8.3 Microcopy (English; mirror in Kannada files)
- **Closing Screen**: 'That's everything for today. Your next letter arrives at 8:00 pm tomorrow. See you at the table.'
- **Landing headline**: 'Skip the scroll. Take a seat.' Subline: 'Six strangers. Four weeks. One table, again and again.'
- **Check-in intro**: 'Three quick questions so we can look after everyone properly. This isn't a test, and we only keep a simple result, not your answers.'
- **Elevated band message**: 'Thanks for being honest. Before we place you in a group, one of our team would like to have a quick, friendly call. If you'd like to talk to someone right now, Tele-MANAS (14416) offers free support; in an emergency call 112. [Verify numbers before launch.]'
- **Deposit terms (shown before payment)**: 'This is a refundable deposit of ₹X. You get it back automatically when the host checks you in. If you can't come, tell us before [time] and you get it back anyway.' [Forfeit policy: DECISION NEEDED.]
- **Skip a Stretch**: 'No problem. Maybe another time.'
- **Withdraw**: 'Thank you for giving it a try. We'll let your host know so they can check in with you kindly. Your letters will be hidden from the pod.'
- **Banned phrases (lint these in CI)**: 'last chance', 'only X left', 'you're missing out', 'don't let them down', 'your streak', 'people are waiting'.

### 8.4 Seed prompts (store in the prompts table; editable by admin)
- **Letters**: level 1 'Something small that made your week better.' Level 2 'A place in Mysuru that feels like yours, and why.' Level 3 'Something you're quietly working on, or hoping for.'
- **Table cards**: Light 'What's the best thing you ate this month?' Real 'What's something you changed your mind about recently?' Deep 'When do you feel most like yourself?'
- **Stretch cards**: level 1 'Tell one person at the next table something you liked about their letter.' Level 2 'Ask someone a question you'd normally skip.' Level 3 'Share one thing you're nervous about right now.'

The Aron-style escalating disclosure idea behind these is supported for short-term closeness, not proven for lasting friendship [REPORTED]. Treat them as a conversation aid, not a technique with guaranteed results.

### 8.5 Visual direction
Warm paper background, one serif for headlines and a clean sans for body, one wave-motif accent colour, large type, generous spacing, light and dark modes. No avatar circles, no like counts, no red badges, no auto-playing motion. Respect prefers-reduced-motion.

---

## 9. Safety, privacy and compliance (build requirements)

### 9.1 Age assurance
18+ only. The AgeAssurance adapter has one method, `verify(user)` returning `is_18_plus` and a method name. The prototype ships `SelfDeclaredStub`, which shows a visible banner: `NOT COMPLIANT FOR PRODUCTION`. The team must choose a real method before any public launch [DECISION NEEDED]; DPDP treats self-declaration as insufficient for verifiable consent where children's data is involved [REPORTED]. Confirm with a lawyer.

### 9.2 Check-in instrument
The wording and scoring must come from a clinical advisor or a published, licensed short screener [DECISION NEEDED]. The agent must not invent clinical questions or cut-offs. Implement the instrument as data in `/config/checkin.json` (items, response options, band thresholds) with placeholders marked `TODO_CLINICAL_REVIEW`, so wording can change without code changes. Store only the band. The app makes no diagnostic or therapeutic claims and shows this on landing and in the Code of Conduct. [REPORTED: NIMHANS guidance warns against such claims.]

### 9.3 Safety operations
- Public venues only. A Taranga host is present at every table. No private-location sharing in the app.
- Women-only pod option. Mixed pods must not have exactly one woman [JUDGMENT].
- Report and block available on every screen. High severity reports email the host instantly and appear at the top of the queue. Target: host responds within 24 hours [JUDGMENT]; for urgent safety, the host calls the member.
- Removal: hosts can remove a member, with a reason logged in audit_log.
- Moderation: KeywordModerator flags letters and notes for the host; it never auto-publishes or auto-deletes. Words suggesting self-harm raise a high-priority flag and show the author a gentle message with helpline details. A human decides next steps.
- Code of Conduct (one page, shown at onboarding): no romantic or sexual solicitation (this is not a dating app), no selling or recruiting, no recording without consent, no sharing others' details, respect for 'no'.
- Known incident evidence: Indian press reports describe harm after app-introduced meetings, and EU data on Yubo shows the grooming risk of stranger discovery [REPORTED, not opened]. No India base rate exists [UNKNOWN]. This is why pods are assigned, hosted and public.

### 9.4 DPDP-oriented checklist
1. Notice and consent: standalone, plain language, purpose-specific, versioned, withdrawable (consents table).
2. Data minimisation: no DOB, no phone, no precise location, no raw screening answers.
3. Retention and deletion: DELETE /api/me works end to end; purge job runs daily.
4. Security: RLS tested, secrets in environment variables, HTTPS only, least-privilege service keys.
5. Breach log: a RUNBOOK section for breach steps; the Act requires notifying the Board and affected people [REPORTED; confirm timelines with counsel].
6. Grievance contact shown on landing and in settings [DECISION NEEDED: name the officer].
7. Photos and video at tables: separate opt-in consent (content_photos purpose); default is no.

### 9.5 CCPA dark-pattern QA checklist (each must be ticked in QA)
False urgency, basket sneaking, confirm shaming, forced action, subscription trap, interface interference, bait and switch, drip pricing, disguised advertisement, nagging, trick wording, SaaS billing, rogue malware. For each: confirm no screen does it, with a screenshot or test reference in `/docs/QA.md`.

### 9.6 Payments
The prototype uses MockProvider only. If Razorpay test mode is added, no live keys. Handling customer deposits has accounting and tax implications [DECISION NEEDED: ask a Chartered Accountant before any real money moves]. The pilot can alternatively collect deposits manually by UPI outside the app and record the status in the console.

---

## 10. Analytics and the pilot experiment

### 10.1 Events (names only; props must never contain letter or note text)
`signup_started`, `onboarding_completed`, `consent_granted`, `checkin_completed` (band only), `waitlisted`, `pod_assigned`, `letter_submitted`, `letter_revealed`, `closing_screen_seen`, `rsvp_yes`, `rsvp_no`, `rsvp_maybe`, `deposit_held`, `attendance_marked`, `deposit_refunded`, `meetup_done`, `stretch_chosen`, `stretch_skipped`, `stretch_completed`, `report_filed`, `block_created`, `feedback_submitted`, `withdrawn`, `account_deleted`.

### 10.2 Key metric views
```sql
create view v_second_meeting_rate as
with m1 as (
  select a.user_id, mt.pod_id from attendance a
  join meetups mt on mt.id = a.meetup_id where mt.seq = 1),
m2 as (
  select a.user_id, mt.pod_id from attendance a
  join meetups mt on mt.id = a.meetup_id where mt.seq = 2)
select p.arm,
  count(m1.user_id) as attended_first,
  count(m2.user_id) as attended_second,
  round(100.0 * count(m2.user_id) / nullif(count(m1.user_id), 0), 1) as second_meeting_pct
from m1
join pods p on p.id = m1.pod_id
left join m2 on m2.user_id = m1.user_id and m2.pod_id = m1.pod_id
group by p.arm;

create view v_show_rate_first_table as
select p.arm,
  count(*) filter (where r.response = 'yes') as said_yes,
  count(a.user_id) as showed_up,
  round(100.0 * count(a.user_id) / nullif(count(*) filter (where r.response = 'yes'), 0), 1) as show_pct
from meetups mt
join pods p on p.id = mt.pod_id
join rsvps r on r.meetup_id = mt.id
left join attendance a on a.meetup_id = mt.id and a.user_id = r.user_id
where mt.seq = 1
group by p.arm;
```
Also build: `hours_together` per pod (sum of meetup durations attended per member), average `felt_safe` and `felt_included` per meetup, women's attendance by meetup (counts only), open and resolved safety reports, signup-to-RSVP time, cost per confirmed attendee (host enters venue and host costs manually).

### 10.3 Pilot design [JUDGMENT, adjust with the team]
- Two pods of 6. Pod A: free arm. Pod B: deposit arm (suggested ₹200 refundable). Same venue and week if possible.
- Three tables each. Recruit 20-24 sign-ups for 12 places. Sources: Strangers & Co attendees, college groups. Never count friends and family as evidence.
- With 12 people, one person is about 8 percentage points. This is a learning pilot, not a statistical trial. Read results as stories plus numbers, and repeat before deciding anything big.
- Pre-register thresholds before seeing data [JUDGMENT starting points]: continue if at least 50% of Table 1 attendees return for Table 2; average `felt_safe` is at least 4 of 5; zero unresolved high-severity reports; women attendees return at a similar rate to others (look at the actual people, not only the percentage).
- Stop rule: any serious safety incident pauses the pilot until reviewed.
- Questions the pilot must answer: Does a deposit change the show rate in Mysuru? Does anyone return for Table 2? Is a dedicated app needed or is WhatsApp plus the host enough? What do cafes charge or share? What group size and cadence work?

---

## 11. Build plan for the agent swarm

### 11.1 Agent roles (layers)
- **Architect**: Repo structure, adapters, conflicts between SPEC and reality, DECISIONS.md
- **Database and Security**: Migrations, RLS, seed data, RLS tests
- **Backend**: Route handlers, jobs, matching, letters, metrics
- **Frontend and UX**: Member PWA, host console, accessibility, motion rules
- **Safety and Compliance Reviewer**: Checks R1-R12, Sections 9.3-9.5, banned phrases, data minimisation, claims discipline (Section 15). Blocking review at every phase end.
- **QA**: Unit, integration and e2e tests, acceptance tests (Section 12)
- **Copy and i18n**: Locale files, tone, Kannada placeholders
- **DevOps and Docs**: Env, CI, README, RUNBOOK, demo reset script

Rule: the Safety and Compliance Reviewer can block a phase. A blocked phase is not done until the reviewer's findings are fixed or consciously logged in DECISIONS.md.

### 11.2 Phases (do in order; stop after each and wait for CONTINUE)
- **P0 Scaffold**: Next.js + TS strict + Tailwind + shadcn/ui, Supabase local setup, adapter interfaces with mocks, banned-phrase lint, `/config/claims.json` built from Section 15 plus the claims lint, banners (MOCK MODE and NOT COMPLIANT FOR PRODUCTION), `.env.example`, README with run steps. Acceptance: Fresh clone runs with zero credentials; AT18, AT20 and AT22 pass.
- **P1 Database**: Migrations from Section 5, RLS policies from 5.1, seed (venues, prompts from 8.4, 1 cycle, 12 fake users, 2 pods). Acceptance: RLS tests prove isolation and letter unlock.
- **P2 Onboarding**: M1-M6, consents, check-in from `/config/checkin.json`, waitlist. Acceptance: AT1-AT4 pass.
- **P3 Host and matching**: H1-H3, matching library with unit tests (Section 6). Acceptance: AT5 passes; suggestions explain themselves.
- **P4 Letters**: M7-M9, unlock view, notification queue, Closing Screen. Acceptance: AT6-AT9 pass.
- **P5 Tables**: M10-M13, H4-H5, RSVP, mock deposit hold and refund, minimum-table rule, Hours Together ledger, Stretch, pod notes. Acceptance: AT11 and AT21 pass.
- **P6 Safety and closing**: Report, block, help button on every screen, H6-H7, moderation adapter, M14-M15, withdraw, export, delete. Acceptance: AT10, AT12-AT16 pass.
- **P7 Metrics and polish**: H8 metric views (Section 10.2), accessibility pass, locale scaffolding (en, kn), QA.md with the CCPA checklist, RUNBOOK, demo reset command. Acceptance: AT17 and AT19 pass; all 22 tests green.

### 11.3 Out of scope for the prototype
Native apps, live payments, live WhatsApp API, real age verification, 1:1 chat, voice or video, AI-generated letters or AI companions, any recommendation feed, public profiles, multi-city support, push notifications, social login, subscriptions, ads, third-party trackers.

### 11.4 Engineering standards
TypeScript strict, zod validation on every input, no any, vitest for units, Playwright for smoke and e2e, axe checks, conventional commits, one commit per phase minimum, no secrets in code, every assumption in ASSUMPTIONS.md, every deviation from SPEC.md in DECISIONS.md. No research claim in code comments or UI unless it appears in Section 15 and is referenced by its claim ID.

---

## 12. Acceptance tests (Given / When / Then)

- **AT1**: Given a user who has not declared 18+, when they submit onboarding, then they cannot continue and nothing beyond their email is stored.
- **AT2**: Given the consent screen, then all toggles are unticked by default, each purpose is saved separately, and withdrawing whatsapp_contact removes that member from wa.me link generation.
- **AT3**: Given a completed check-in, when I inspect the database, then only a band row exists and no answers are stored anywhere, including logs.
- **AT4**: Given an elevated-band member, then they do not appear in match suggestions until the host records a follow-up.
- **AT5**: Given a waitlist, when matching runs, then women-only requesters are never in mixed pods, no mixed pod has exactly one woman, blocked pairs are never together, and every pod has 5-7 people.
- **AT6**: Given members A and B in one pod, when B has not submitted letter 1, then A's letter 1 returns zero rows for B through both the API and a direct query as B.
- **AT7**: Given B submits letter 1 at 3:00 pm with letter_hour 20, then A's letter 1 becomes visible to B at 8:00 pm the same day and not earlier.
- **AT8**: Given a reveal session, then it ends on the Closing Screen and offers no further content.
- **AT9**: Given any user, then at most one notification is queued per day, each with a non-empty reason_text.
- **AT10**: Given a member, then they can read only display_name for other pod members, and nothing for people outside their pod.
- **AT11**: Given the deposit arm, when a member RSVPs yes, then MockProvider creates a hold; when the host checks them in, the hold is refunded; a no-show follows the configured policy.
- **AT12**: Given a high-severity report, then an open safety_reports row exists, the host email appears in the console log within one minute, and it tops the H6 queue.
- **AT13**: Given a block, then both users' letters and notes are hidden from each other and the host is notified.
- **AT14**: Given a letter containing a self-harm keyword, then the host gets a high-priority flag, the author sees a gentle helpline message, and the letter is not deleted.
- **AT15**: Given a withdrawal, then the member's letters are hidden from the pod and the host gets a follow-up task.
- **AT16**: Given account deletion, then profile and personal rows are removed, event_log.user_id is nulled, and a prior export contains the user's data.
- **AT17**: Given a fixture dataset, then v_second_meeting_rate and v_show_rate_first_table return values that match hand-calculated results in the test.
- **AT18**: Given any banned phrase in components or locale files, then CI fails.
- **AT19**: Given every page, then axe reports no serious violations and onboarding can be completed using only the keyboard.
- **AT20**: Given a fresh clone with no credentials, then the app runs and shows both MOCK MODE and NOT COMPLIANT FOR PRODUCTION banners.
- **AT21**: Given a meetup with fewer than 4 confirmed yes RSVPs 24 hours before it starts, then a host task is created to reschedule or merge, and members get a neutral message with no guilt or urgency wording.
- **AT22**: Given any statistic or research claim in a locale file or component, then it must reference a claim ID in /config/claims.json, and CI fails on any number-plus-percent or study-name string that is not tied to a claim ID.

---

## 13. Master prompt (paste this into Antigravity or Replit Agent)

Attach this whole document as /docs/SPEC.md first.

### ROLE
You are a coordinated team of software agents (Architect, Database and Security, Backend, Frontend and UX, Safety and Compliance Reviewer, QA, Copy and i18n, DevOps and Docs) building a pilot prototype called Taranga Tables for a nine-person student team in Mysuru, India. Taranga means wave. The product puts small groups of strangers through a four-week Wave of slow letters and three in-person tables, hosted by a person, so they can become friends offline.

### FIRST ACTIONS (before writing any code)
1. Read /docs/SPEC.md completely. It is the source of truth. If this prompt and SPEC.md disagree, SPEC.md wins; log the conflict in /docs/DECISIONS.md. Where Section 15 (verification log) conflicts with Sections 1 to 14, Section 15 wins.
2. Create /docs/DECISIONS.md and /docs/ASSUMPTIONS.md. Log every assumption you make and every [DECISION NEEDED] you meet. Never resolve a [DECISION NEEDED] silently: implement the default stated in SPEC.md behind a config flag in /config and log it.
3. Create /config/claims.json from the PITCH-SAFE table in Section 15 (id, approved wording, source, status). This is the only place research claims may come from.
4. Reply with a plan of at most 15 lines, then begin Phase P0.

### MISSION
Build the smallest working system that lets one host run a four-week, two-pod pilot (two pods of six people, three tables each) and measure: second-table attendance, show rate with and without a refundable deposit, felt safety, and safety incidents. This is a learning prototype, not a scalable product.

### HARD RULES (never break)
1. The North Star is shared offline hours between the same people. Time in the app is an anti-metric. Build nothing that increases time in the app.
2. No feed, swiping, browsing of people, streaks, points, leaderboards, variable-reward notifications, fake urgency or scarcity, guilt or shame copy, AI companions, or AI-written letters.
3. Obey Design Constitution R1-R12 (Section 3.3) and the banned-phrase list (Section 8.3). Add a CI lint for it.
4. Do not claim anything about hormones, oxytocin or dopamine anywhere, and make no therapeutic or diagnostic claim.
5. Data minimisation (Section 5): no date of birth, no phone number, no precise location, no stored check-in answers, no letter or note text in logs or event props.
6. Every external service sits behind an adapter with a mock default (payments, age assurance, email and WhatsApp, moderation). The app must run on a fresh clone with zero credentials and show MOCK MODE and NOT COMPLIANT FOR PRODUCTION banners.
7. Do not invent clinical questions, helpline numbers, legal text or statistics. Where SPEC.md says [DECISION NEEDED] or TODO_CLINICAL_REVIEW, leave a clearly marked placeholder and log it.
8. Security: Row Level Security on every table, letter unlock enforced in the database not only the UI, secrets only in environment variables, least-privilege keys.
9. No live money, no live messaging, no third-party trackers.
10. Do not add features that are not in SPEC.md. If you think one is needed, propose it in DECISIONS.md and wait.
11. Evidence discipline: any research finding, statistic or study name shown to users or written in docs must be displayed through a claim ID from /config/claims.json with its approved wording. Do not add, round up, strengthen or paraphrase a claim. Correlational findings must keep their caveat. Items on the DO-NOT-USE list in Section 15 must never appear.
12. Minimum table rule: if fewer than 4 members have confirmed yes 24 hours before a table, create a host task to reschedule or merge, and message members neutrally.

### STACK (fixed unless you log a reason)
Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, Supabase Postgres with RLS and email OTP auth, zod, vitest, Playwright, axe. Asia/Kolkata timezone. Mobile-first at 360px, installable PWA, English and Kannada locale files.

### ENV (provide in .env.example)
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PAYMENT_PROVIDER=mock
AGE_PROVIDER=self_declared_stub
NOTIFY_PROVIDER=console
MODERATION_PROVIDER=keyword
APP_TIMEZONE=Asia/Kolkata
MOCK_MODE=true
```

### WORKING METHOD
Work in phases P0 to P7 exactly as in SPEC.md Section 11.2. For each phase:
1. Plan in at most 15 lines.
2. Implement.
3. Run tests; the phase's acceptance tests from SPEC.md Section 12 must pass.
4. Safety and Compliance Reviewer audits against R1-R12, Sections 9.3-9.5 and the evidence discipline rule, and may block the phase.
5. Write or update a demo script in the README for this phase.
6. Commit.
7. STOP and report in at most 12 lines: what is done, test results, deviations from SPEC.md, open questions, risks. Wait for me to type CONTINUE.

### QUALITY BAR
Strict types, no any, input validation on every route, meaningful error messages, accessible components, no dead code, no TODOs without an entry in ASSUMPTIONS.md or DECISIONS.md. Seed data must be fake and obviously fake. Keep UI copy short, calm and neutral.

### WHEN YOU ARE UNSURE
Say what you do not know. Pick the safest option consistent with SPEC.md, log it, and continue. Ask me only when a choice is blocking or irreversible.

### FINAL DEFINITION OF DONE
A fresh clone runs `pnpm install && pnpm seed:demo && pnpm dev`; the README demo script walks a host and six members through a full Wave; all 22 acceptance tests pass; `/docs/QA.md` contains the CCPA dark-pattern checklist with evidence; `/docs/RUNBOOK.md` covers deploy, backup, breach steps and the pilot day-of checklist.

---

## 14. Open decisions and what is still unknown

### 14.1 Decisions for the team
| # | Decision | Default in this spec |
|---|---|---|
| 1 | Product name | Taranga Tables |
| 2 | Table cadence | Weekly |
| 3 | Deposit amount, and what happens to a no-show deposit | ₹200 refundable; policy undecided |
| 4 | Real age-assurance method before public launch | Stub only |
| 5 | Check-in instrument and clinical advisor | Placeholder config, TODO_CLINICAL_REVIEW |
| 6 | Helpline numbers to show | Tele-MANAS 14416 and 112, verify before launch |
| 7 | Named grievance officer | None |
| 8 | Data retention periods | 90 days for screenings and notifications |
| 9 | Whether hosts may see feedback free text | No, unless the member opts in |
| 10 | Venue terms with the cafe (price, revenue share, host seating) | Unknown |
| 11 | How deposits are held legally and taxed (ask a Chartered Accountant) | Mock only; or manual UPI outside the app |
| 12 | Photo and video policy at tables | No photos unless separately consented |

### 14.2 What this spec does not know
- Whether anyone returns for Table 2 (the key unknown).
- Mysuru demand, willingness to pay, and women's comfort at stranger tables.
- Whether a dedicated app beats WhatsApp plus a host. If the pilot shows the host and WhatsApp are enough, the right outcome is to keep the host model and shelve the app.
- Competition: the fixed-small-group idea is not unique. A US competitor (NexSpark Friends, groups of 4-6 who keep meeting, per its own site) and Timeleft's own 'Repeat' feature, both described in a competitor-authored review, address the same gap. What may still differ for Taranga is the Mysuru/Tier-2 setting and the host-led offline community [HYPOTHESIS].
- Official gazette texts, EU and Indian incident data, and many competitor figures were not opened. Section 15 lists exactly what was and was not checked.
- Group size (6) and cadence are starting guesses, not findings.

### 14.3 After the pilot
Bring back the raw numbers (the two metric views, feedback scores, host notes, any incidents). We will update the Evidence ledger, change the spec, and decide whether to extend, change or stop.

---

## 15. Verification log (21 October 2026): what is safe to say

This section supersedes Sections 1 to 14 wherever they differ. I opened or searched the sources below myself. Everything else in the two research reports is unverified until you open it.

### 15.1 PITCH-SAFE claims (build /config/claims.json from this table)
| ID | Approved wording (do not strengthen) | Status and how checked |
|---|---|---|
| PS-01 | About 1 in 6 people worldwide experience loneliness. WHO reports it is highest among adolescents and young adults (about 1 in 5) and in low-income countries (nearly 1 in 4). | VERIFIED. WHO Commission page opened. No Mysuru or India-specific figure exists. |
| PS-02 | One study estimated roughly 40-60 hours together to become a casual friend, 80-100 hours to become a friend, and 200+ hours to become a close friend. These are rough estimates from US samples, self-reported and correlational. | VERIFIED. Hall 2018 via University of Kansas summary opened. |
| PS-03 | In one analysis of 1,070+ events, mostly business events, paid events had a median no-show rate of about 17% against about 28% for free events. | VERIFIED as reported by Skift and Live Group (secondary). Not a study of friendship meetups. |
| PS-04 | One company reported that a $100 refundable deposit raised attendance at its event from about 45% to about 90% (55 registrants). | VERIFIED as reported by Skift. One small event; do not generalise. |
| PS-05 | A meta-analysis of 141 studies (about 145,000 people) found most links between active or passive social media use and wellbeing were negligible. Active use was linked to more perceived online support, and also to slightly more anxiety. Neither was clearly linked to offline support. | VERIFIED. Godard and Holtzman, J. Computer-Mediated Communication, 2024, opened. Mostly correlational. |
| PS-06 | Under India's DPDP Act 2023, a child is anyone under 18; verifiable parental consent is required before processing a child's data (s9(1)); tracking or behavioural monitoring of children is prohibited (s9(3)). | VERIFIED against an Act-text mirror (cadp.in). Check the Gazette copy before relying on it. |
| PS-07 | DPDP penalties can reach up to ₹250 crore for failing security safeguards and up to ₹200 crore each for failing breach notification or children's obligations. | VERIFIED against the Schedule in the same mirror. These are maximums, not typical fines. |
| PS-08 | India's Central Consumer Protection Authority notified guidelines specifying 13 dark patterns. It issued notices to BookMyShow (pre-ticked donation) and IndiGo (guilt-wording on a button); both changed their designs after intervention. | VERIFIED. PIB press release opened. These were notices, not court rulings. |
| PS-09 | A critical review of human research found the evidence that oxytocin increases trust is not robust. | REPORTED at abstract level (search results opened, full paper not). |
| PS-10 | NIMHANS researchers reviewed 350 mental health apps and say India has no regulatory guidelines specific to such apps. | REPORTED from a news interview; primary paper not opened. |
| PS-11 | A published meta-analysis of if-then planning for alcohol consumption found a small overall effect and no clear effect when delivered online. | VERIFIED at abstract level. Different behaviour from meetup attendance, so it is a caution, not a prediction. |
| PS-12 | (internal only, never shown to users) Timeleft reports 3M+ members, 200+ cities, 52 countries; pricing is not published; no-show fee can be up to 35% of a monthly subscription; tables reset weekly; it has a 'Repeat' feature. | REPORTED. Source is a review written by a direct competitor, who discloses this. Company figures are self-reported and have varied between pages and dates. |

### 15.2 DO-NOT-USE list (found wrong, unverifiable or too weak)
- Report A's Hall numbers (36/50/200, 2019): wrong. Use PS-02.
- Report A's WHO figures ('1 in 4 older adults', '5-15% adolescents'): not what the WHO page says. Use PS-01.
- Report A's Pew claim (about 50% of online friends meet, 1 in 3 lasting): not supported by Report B or anything I opened.
- Report A's oxytocin citation 'Declerck et al., PNAS 2020' and a Nature Reviews Neuroscience dopamine citation: I could not match them to real papers. Do not cite. Use PS-09 or say nothing.
- Obviously placeholder or invented-looking links in Report A (a Hindu article ID, a Zooop App Store ID): discard those items.
- '72-hour breach reporting': not in the Act text I opened (the Act says the Board and affected people must be told in the prescribed manner). Check the Rules.
- 'CCPA ruled': they were notices. Use PS-08.
- 'Implementation intentions d = 0.65': a classic finding from my own knowledge, but Report B linked a different paper. Do not quote until you open the right source.
- Holt-Lunstad (50% higher survival, OR 1.50): matches the paper as I know it, but not opened this session. Open before quoting.
- Group size '6-8 preferred': comes from a psychiatric group study. Our size of 6 is a design choice.
- Competitor user numbers, revenue estimates and failure stories (Lunchclub, Geneva, Bumble BFF revenue, Meetup revenue, Yubo EU figures): not opened, mostly secondary or company-reported.
- Rupee price points, MVP costs and WhatsApp pricing: vendor blogs, may be stale.
- NIMHANS '2026 guidelines' quotes in Report A: I could not confirm that document; only PS-10 is safe.

### 15.3 Spec changes triggered by verification
1. **Minimum table rule** (added as hard rule 12 and AT21). Small events (10-49 people) had a median no-show of about 32% in Live Group's summary (a UK events agency, secondary). A 6-person table that loses 2 people changes the evening, so reschedule or merge below 4 confirmed.
2. **Treat the deposit as a hypothesis.** PS-03 and PS-04 come from business events, not friendship meetups with strangers in Mysuru. The pilot arms test it.
3. **No 'passive scrolling is toxic' copy.** PS-05 shows effects are negligible on average, and active use is linked to slightly more anxiety. Our reason for removing the feed is our own goal (offline hours), not a proven harm of feeds.
4. **18+ is a hard requirement.** Under DPDP a child is anyone under 18 and tracking children is prohibited (PS-06). Self-declaration is a stub only. [REPORTED by both reports that it is not verifiable consent; confirm with a lawyer.]
5. **Startup exemption is not a plan.** Section 17(3) lets the Government exempt notified classes of startups from some obligations (for example notice and erasure). Only a private company, partnership or LLP recognised as a startup could qualify, and only if notified. Do not rely on it. Taranga's legal form is currently unregistered per the dossier [DECISION NEEDED].
6. **Competition note.** Fixed small groups are not unique (see 14.2). Do not claim 'no one does this' anywhere.
7. **Helpline numbers stay [verify before launch].** I did not open an official source for Tele-MANAS this session.

### 15.4 Not checked (open before you cite)
DPDP Rules 2025 timelines; the Gazette text of the Act and of the CCPA guidelines; the EU Council Yubo document; Pew 2023; Holt-Lunstad 2010; Sandstrom and Dunn 2014; Aron 1997; the Meetup PLOS ONE network study; Bumble and Geneva financial statements; the NIMHANS guideline PDF; Timeleft's own terms; all WhatsApp and MVP price sources; Indian press reports of app-linked harm.

### 15.5 Corrections to what I told you earlier in chat
- Hall's hours are cumulative (about 50, about 90, 200+), not '50 plus 90 more'.
- Timeleft figures I quoted earlier (about 1M users, 275 cities, 62 countries) differ from the later ones (3M+, 200+, 52). Both are company claims; neither is independent.
- My earlier line that no product owns the fixed-group gap was too strong (see 14.2).
