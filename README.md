# Taranga Tables (Prototype)

> **A Taranga project in Mysuru, India**  
> *Six strangers. Four weeks. One table, again and again.*

This is a prototype web application built for running a four-week, two-pod pilot (two pods of six people, three tables each) in Mysuru to measure second-table attendance, show rates with/without a refundable deposit, felt safety, and offline connection hours.

---

## 1. Quick Start (Fresh Clone)

The application is engineered to run out-of-the-box with **zero credentials** using local mock adapters.

```bash
# 1. Install dependencies
pnpm install

# 2. Seed mock demo data
pnpm seed:demo

# 3. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Testing & Compliance Validation

All engineering standards, acceptance tests, and lint rules run locally:

```bash
# Run acceptance tests (vitest)
pnpm test

# Run strict banned phrase & claims discipline lints (AT18 & AT22)
pnpm lint
```

---

## 3. Core Principles & Design Constitution

1. **North Star**: Shared offline hours between the same people. App screen time is an anti-metric.
2. **No Growth-Hacking / Dark Patterns**: No feeds, swiping, points, streaks, badges, fake urgency, or guilt copy.
3. **Evidence Discipline**: All research claims and statistics must map directly to `/config/claims.json` (from SPEC.md Section 15.1). Any untied percentage or unverified study citation fails CI (AT22).
4. **Data Minimisation**: No Date of Birth (DOB), no phone numbers, no exact locations, and no raw clinical answers stored in the database.
5. **Zero-Credential Adapters**:
   - `PaymentProvider`: Local `MockProvider`
   - `AgeAssurance`: `SelfDeclaredStub` (displays `NOT COMPLIANT FOR PRODUCTION` banner per DPDP requirements)
   - `Notify`: `ConsoleNotifyAdapter`
   - `Moderation`: `KeywordModerator` (flags self-harm keywords for human review; presents supportive helpline copy without auto-deletion)

---

## 4. Phase Demo Scripts

### Phase P0: Scaffold & Compliance
1. Run `pnpm test` -> Acceptance tests pass across AT18, AT20, and AT22.
2. Run `pnpm lint` -> Confirms zero banned phrases and complete claims discipline.
3. Run `pnpm dev` and visit `http://localhost:3000`:
   - Inspect top banners: `MOCK MODE` and `NOT COMPLIANT FOR PRODUCTION`.

### Phase P1: Database & RLS Isolation
1. Inspect schema migrations in `/supabase/migrations/20261021000000_init_schema.sql` and `/supabase/seed.sql`.
2. Run `pnpm seed:demo` -> Verifies seed data (1 cycle, 2 venues, 9 prompts, 1 host, 12 fake users, 2 pods).
3. Run `pnpm test tests/p1-rls-letter-unlock.test.ts` -> Proves:
   - **AT10**: Member profile isolation (only display names visible within the active pod; zero leak of phone/DOB/location).
   - **AT6**: Write-to-unlock reciprocity (0 rows returned if reader hasn't submitted their own letter).
   - **AT7**: Reveal time enforcement (letters unlock at 8:00 PM Asia/Kolkata, never earlier).
   - **AT13 (preview)**: Block pairs cannot view each other's letters.

### Phase P2: Onboarding & Consents (M1 - M6)
1. Run `pnpm test tests/p2-onboarding-at1-at4.test.ts` -> Proves:
   - **AT1**: Under-18 declaration immediately rejects onboarding and stores nothing in database.
   - **AT2**: Standalone consent toggles are unticked by default; withdrawing WhatsApp removes member from wa.me links.
   - **AT3**: Check-in saves only triage band; raw question answers are discarded immediately and never logged.
   - **AT4**: Elevated triage band shows supportive Tele-MANAS resources and holds member from matching.
2. In browser, visit `http://localhost:3000`:
   - Click "Begin Onboarding" -> navigates through M2 Sign-in, M3 6-step Stepper, M4 Consents, M5 Check-in, M6 Honest Waitlist.
   - Tap "Help & Report" floating button to view emergency 24/7 helplines (Tele-MANAS: 14416, Emergency: 112).

### Phase P3: Host Console & Matching Algorithm (H1 - H3)
1. Run `pnpm test tests/p3-matching-at5.test.ts` -> Proves:
   - **AT5**: Women-only requesters are never placed in mixed pods.
   - **AT5**: No mixed pod has exactly one woman.
   - **AT5**: Blocked pairs are never placed together in the same pod.
   - **AT5**: Every pod has between 5 and 7 members (default 6).
   - Suggestions explain themselves with plain-language 'why these people' summary lines.
   - Every pod approval and member removal writes to `audit_log`.
2. In browser, visit `http://localhost:3000/host`:
   - Inspect the H1 Waitlist pool and active pods.
   - Click "Review Suggestions" -> inspect H2 suggested pods with soft scores and 'why these people' rationales.
   - Click "Approve Pod" -> pod is confirmed into active wave.
   - Visit `/host/pods/pod-a` -> view members and test host removal with audit log justification.

### Phase P4: Letters & Closing Screen (M7 - M9)
1. Run `pnpm test tests/p4-letters-at6-at9.test.ts` -> Proves:
   - **AT6**: Write-to-unlock reciprocity (zero rows returned if reader has not submitted letter N).
   - **AT7**: Reveal time enforcement (letters unlock at configured `letter_hour`, e.g. 8:00 PM IST, never earlier).
   - **AT8**: Letters session concludes on Closing Screen with no infinite feed.
   - **AT9**: One notification queued per day maximum, each with a clear reason text.
2. In browser, visit `http://localhost:3000/pod` -> view Hours Together ring, letter progress, prompt, and Closing Screen.

### Phase P5: Tables & Meetup Lifecycle (M10 - M13, H4 - H5)
1. Run `pnpm test tests/p5-tables-at11-at21.test.ts` -> Proves:
   - **AT11**: Deposit hold created on RSVP yes for deposit arm; automatically refunded upon host check-in; no-shows follow configured policy (`forfeit` or `refund`).
   - **AT21**: Minimum table rule (< 4 confirmed yes RSVPs 24h before table triggers host task; members receive neutral updates with no guilt wording).
   - **Stretch Cards**: Equal-sized skip and accept buttons; skip has no penalty (*"No problem. Maybe another time."*).
   - **Pod Notes**: Text only, 500-char limit, block-aware, self-harm keyword protection.
2. In browser:
   - Visit `/pod/rsvp` -> Table invite & RSVP with refundable deposit terms.
   - Visit `/pod/table/day` -> Host contact info, venue, and running-late notifier.
   - Visit `/pod/stretch` -> Stretch cards with equal-sized actions.
   - Visit `/pod/notes` -> Shared quiet pod notes.
   - Visit `/host/pods/[id]/meetups` -> H4 Meetup scheduler.
   - Visit `/host/meetups/[id]/checkin` -> H5 Large tap-target mobile cafe check-in console.

### Phase P6: Safety, Blocking & Member Rights (H6 - H7, M14 - M15)
1. Run `pnpm test tests/p6-safety-at10-at12-at16.test.ts` -> Proves:
   - **AT10**: Members read only `display_name` for other pod members, and nothing for people outside their pod.
   - **AT12**: High-severity safety report creates an open ticket, emails host instantly, and tops the H6 queue.
   - **AT13**: Blocking reciprocally hides letters and notes, and notifies host without alerting the blocked person.
   - **AT14**: Self-harm keyword triggers supportive Tele-MANAS helpline and flags host without deleting the letter.
   - **AT15**: Member withdrawal hides letters from the pod and creates host personal follow-up task.
   - **AT16**: Account deletion removes profile & personal rows, nulls `event_log.user_id`, and prior export provides complete data.
2. In browser:
   - Use floating "Help & Report" button on any screen to file confidential safety report.
   - Visit `/host/safety` -> H6 Safety Queue with resolution workflow.
   - Visit `/host/followups` -> H7 Check-in follow-ups for elevated applicants and withdrawals.
   - Visit `/pod/closing` -> M14 Closing choices (Keep table, Strangers & Co, Part kindly) + 2-min feedback.
   - Visit `/settings` -> M15 Settings, member blocking, data export, withdrawal, and account deletion.

### Phase P7: Metrics & Polish (H8, Locales, QA & Runbook)
1. Run `pnpm test tests/p7-metrics-polish-at17-at19.test.ts` -> Proves:
   - **AT17**: `v_second_meeting_rate` and `v_show_rate_first_table` match hand-calculated fixture values.
   - **AT19**: Onboarding stepper is fully keyboard-navigable and accessible with standard aria attributes.
2. Inspect operational documentation:
   - `/docs/QA.md` -> Full CCPA Dark Patterns checklist and DPDP compliance matrix.
   - `/docs/RUNBOOK.md` -> Incident response, high-severity report alerts, breach protocols, and demo reset.
   - `/locales/en.json` & `/locales/kn.json` -> English and Kannada microcopy placeholders.
3. In browser, visit `/host/metrics` -> H8 Pilot Metrics dashboard.

### Phase P8: v2.0 Features (M13, M14, M16, M18, H3b, H9, H10, Cron Tick)
1. Run `pnpm test tests/p8-v2-features.test.ts` -- 32 tests proving M13 Opener, M14 Seen Cards, M16 Quests, M18 Events (N18 gate), Games Library, Cron Tick idempotency.
2. In browser:
   - `/pod/opener` -- M13 Opener Card (Peeve or Favourite arm)
   - `/pod/seen` -- M14 Write a Seen card (10-200 chars)
   - `/pod/quests` -- M16 Open bounties (group min 4, N17), passport stamps
   - `/pod/events` -- M18 Taranga Events (closing pod only, N18)
   - `/host/pods/[id]/print` -- H3b A4 Letter Box Print View
   - `/host/content` -- H9 Content Console (Prompts / Games / Waypoints / Bounties / Outbox)
   - `/host/events` -- H10 Events Console (create, track interest, mark attendance)
   - `GET /api/jobs/tick` -- Cron tick (idempotent, safe to call hourly)

---

## 5. Definition of Done

| Requirement | Status |
|---|---|
| Fresh clone -- pnpm install, pnpm seed:demo, pnpm dev | PASS |
| 93 acceptance tests (pnpm test) | PASS |
| Banned-phrase lint (pnpm lint:banned) | PASS |
| Claims-discipline lint (pnpm lint:claims) | PASS |
| Zero TypeScript errors (pnpm exec tsc --noEmit) | PASS |
| Production build -- 41 routes (pnpm build) | PASS |
| /docs/QA.md -- CCPA dark-pattern checklist | PASS |
| /docs/RUNBOOK.md -- deploy, backup, breach, pilot-day | PASS |
| /docs/DECISIONS.md -- D1-D10 behind flags | PASS |
| /config/claims.json -- all research claims ID-tied | PASS |
| N1-N18 enforced in code and tests | PASS |
