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


