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

## 4. Phase P0 Demo Script

1. Clone or navigate to the repository.
2. Run `pnpm test` -> 8 acceptance tests pass across AT18, AT20, and AT22.
3. Run `pnpm lint` -> Confirms zero banned phrases and complete claims discipline.
4. Run `pnpm dev` and visit `http://localhost:3000`:
   - Inspect the top banners:
     - `MOCK MODE: Running with local mock adapters and zero external credentials.`
     - `NOT COMPLIANT FOR PRODUCTION: Self-declared age assurance stub active.`
   - Observe the warm paper design aesthetic, serif headings, and clean sans body text.
