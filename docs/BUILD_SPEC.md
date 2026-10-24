# Taranga Tables: Standalone Build Specification v2.0

For Antigravity, Replit Agent or any coding agent. Self-contained. Prepared 24 October 2026 for Varun and the Taranga team. Status: PROVISIONAL until your team approves it.

- How to use this document
- PART A: THE AGENT PROMPT (paste this first)
- PART B: THE BUILD SPECIFICATION
  - 0. What changed from v1.0
  - 1. Product brief
  - 2. Non-negotiables
  - 3. Evidence and claims (build /config/claims.json from this table)
  - 4. Technology, structure and security model
  - 5. UI/UX design system
  - 6. Screens
  - 7. Database (single migration: supabase/migrations/0001_init.sql)
  - 8. Logic specifications
  - 9. Safety and compliance
  - 10. Metrics (views; read only by host routes using the service role)
  - 11. Test plan (all must pass)
  - 12. Phases (the agent stops after each one)
  - 13. Open decisions for your team (defaults already built)

---

## How to use this document

1. Save this whole file as /docs/BUILD_SPEC.md in an empty repo.
2. Paste Part A (the agent prompt) as your first message to the agent.
3. The agent builds in phases P0 to P8 and stops after each. You type CONTINUE to go on.
4. Labels used everywhere: [EVIDENCE] verified from an opened source. [REPORTED] stated by a research report, not independently opened. [HYPOTHESIS] to be tested in the pilot. [JUDGMENT] my default, change if you disagree. [DECISION NEEDED] your team must choose; the agent builds the stated default behind a flag.
5. What the app needs to run: a Supabase project (hosted free tier, or local Docker). It does not need payment, WhatsApp, email-provider or age-verification credentials, because those are mocked.
6. What this v2.0 fixes from v1.0: see Section 0.

---

## PART A: THE AGENT PROMPT

**ROLE.** You are a coordinated team of software agents (Architect, Database and Security, Backend, Frontend and UX, Safety and Compliance Reviewer, QA, Copy and i18n, DevOps and Docs) building a pilot prototype called Taranga Tables for a nine-person student team in Mysuru, India. It puts small groups of strangers through a four-week “Wave” of slow letters and three hosted in-person tables so they can become friends offline. It is the opposite of an attention app: time in the app is an anti-metric. Taranga, a community and events team, runs it. Its business purpose is to bring people to Taranga’s real-world events honestly, never by pressure.

**FIRST ACTIONS.**
1. Read /docs/BUILD_SPEC.md completely. It is the source of truth.
2. Create /docs/DECISIONS.md and /docs/ASSUMPTIONS.md. Log every assumption and every [DECISION NEEDED]. Never resolve a [DECISION NEEDED] silently: implement the stated default behind a flag in /config/flags.json and log it.
3. Create /config/claims.json from Section 3 (the only place research claims may come from).
4. Reply with a plan of at most 15 lines, then start Phase P0.

**WHAT “WORKING” MEANS.** Nothing is done until you have RUN it. At the end of every phase run and show the real output of: pnpm lint, pnpm typecheck, pnpm test, pnpm test:rls, pnpm test:e2e, pnpm test:a11y. If something fails, fix it or log it as a blocker. Never mark a phase done with a failing check. Never claim a feature works because the code looks right. The database migration must be executed against a real Postgres and the output shown.

**HARD RULES.** Obey Section 2 (N1 to N18) exactly. In particular: no feed, swiping, streaks, points, rankings, urgency or guilt copy; no hormone or dopamine claims; data minimisation; letter unlock enforced in the database; reads through the user-scoped client so Row Level Security applies; writes only through server commands with explicit authorisation checks; every external service behind a mock adapter.

**DESIGN.** Build the UI exactly to Sections 5 and 6: tokens, type, components, layouts and copy. Do not substitute a generic template look. Capture screenshots of every screen at 360x740, 390x844 and 768x1024 into /docs/screens at the end of phases P2, P4, P5 and P7.

**METHOD (per phase).** 1. Plan in at most 15 lines. 2. Implement. 3. Run all checks. 4. The Safety and Compliance Reviewer audits against N1 to N18 and Section 9 and may block. 5. Update the README demo script. 6. Commit. 7. STOP and report in at most 12 lines: done, check results, deviations, open questions, risks. Wait for CONTINUE.

**WHEN UNSURE.** Say what you do not know, pick the safest option consistent with the spec, log it, continue. Ask only when blocked or irreversible.

**COMMON FAILURE TRAPS (read before coding).** Section 4.7 lists the mistakes agents usually make with Next.js, Supabase and RLS. Follow it.

**DEFINITION OF DONE.** A fresh clone with Supabase env vars set runs pnpm install, pnpm db:migrate, pnpm seed:demo, pnpm dev. The README demo walks a host and six members through a full Wave, including the Day 28 Taranga events card. All tests in Section 11 pass. /docs/QA.md has the dark-pattern checklist with evidence. /docs/RUNBOOK.md covers deploy, backup, breach steps and a pilot-day checklist.

---

## PART B: THE BUILD SPECIFICATION

### 0. What changed from v1.0
1. Sections 9, 10 and 11 were referenced but missing: Written in full (safety and compliance, metrics views, test plan), plus phases P0 to P8 and a content library.
2. Screen M13 was missing; the Letter Box print view and the Table 1 opener had no screen: M13 (opener card) and H3b (Letter Box print view) added.
3. `bounties_guard` read old on INSERT, which can crash in PL/pgSQL: Rewritten with nested IF.
4. Pod capacity trigger had a race (two joins at once): Pod row locked with FOR UPDATE.
5. Staff could not read unverified games, inactive waypoints or draft bounties: Staff read policies added.
6. Table reminders at 3h and 24h broke rule N5: One daily digest at the user’s letter hour; table lines folded into it.
7. The demo “seed.sql” cannot create login users: `pnpm seed:demo` uses the Supabase admin API; seed.sql holds content only.
8. Dev login mechanism was not defined: Password sign-in for seeded personas, only in mock mode.
9. Gender was used by matching but never collected: Optional self-description in onboarding step 5.
10. Letter pacing was undefined: Next letter writable 48 hours after the last [JUDGMENT, flag].
11. The business goal (Taranga events) had no mechanism: Section 1.5 funnel, tables `taranga_events` and `event_interest`, consent `taranga_updates`, screen M18, host screen H10, rules N17 and N18.
12. Core unlock functions could be probed via RPC: Core functions take an explicit user id and are not executable by app roles.
13. No cron design for hosting that limits cron frequency: Single `/api/jobs/tick` endpoint, external scheduler, idempotent.
14. No Day 28 or graduation data model: `closing_choices` and `wave_feedback` tables.

### 1. Product brief
Small-group friendship product run by a Taranga host in Mysuru. 4-week Wave of slow letters and 3 hosted tables. North Star: shared offline hours between the same people. Anti-metric: minutes in the app. No dopamine or oxytocin claims (N12).

### 2. Non-negotiables (N1 to N18)
- N1: One content screen per day per user (the letter reveal), ending on the Closing Screen.
- N2: No feed, swiping, streaks, points, badges, rankings.
- N3: Letters unlock only after you submit your own letter of the same number.
- N4: Pods assigned by host and locked for the Wave.
- N5: At most one notification per user per day at their letter hour with reason text.
- N6: Neutral copy. Banned: "last chance", "only X left", "you're missing out", "don't let them down", "your streak", "people are waiting", "hurry", "limited spots", "don't miss".
- N7: Skipping or declining anything is always an equal-size, no-penalty button.
- N8: Show who runs the app (Taranga) on landing, onboarding, and Closing.
- N9: Leaving pod and deleting data are one tap each (plus one equal-size confirm sheet) with no guilt screens.
- N10: Deposits are never pre-ticked, terms shown before paying, automatic refund on check-in.
- N11: Data minimisation: no DOB, no phone number, no precise location, no stored clinical check-in answers, no letter text in logs.
- N12: No hormone/oxytocin/dopamine claims, no therapeutic or diagnostic claims.
- N13: Public venues only, Taranga host present, report and block reachable from every screen, women-only pod option, 18+ only.
- N14: Evidence discipline: all research statements must come from /config/claims.json.
- N15: Original code and design only.
- N16: Minimum table rule: < 4 confirmed yes RSVPs 24h before table triggers host task to reschedule or merge with neutral member message.
- N17: Waypoints must be public, verified in person, daytime only (07:00 to 18:30 IST), group min 4.
- N18: Taranga event promotions shown only after the Wave with a calm card and explicit opt-in consent (`taranga_updates`).

### 13. Open decisions for your team (defaults already built)
- D1: Deposit forfeits on no-show with no notice -> Mock only; terms shown.
- D2: Letter gap between letters -> 48 hours (flag).
- D3: Two hosts at Table 1 -> Recommended, not enforced.
- D4: Real age assurance before public launch -> Self-declared stub plus banner.
- D5: Data retention -> Delete letters and notes 90 days after the Wave.
- D6: Mixed pods must not contain exactly one woman -> On.
- D7: Table 3 handoff download ("Keep the Table" host kit) -> Placeholder PDF.
- D8: Real Waypoints -> None active until a host visits and verifies.
- D9: Clinical wording for the check-in -> Placeholder until reviewed by a clinician.
- D10: Kannada translations -> Draft strings; native review before launch.
