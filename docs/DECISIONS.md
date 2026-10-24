# DECISIONS.md

This document records architectural decisions, conflicts resolved, and how each `[DECISION NEEDED]` from `SPEC.md` is handled. Per Section 13, all decisions implement the default stated in `SPEC.md` behind config flags in `/config/settings.json` or `/config/decisions.json`.

---

## 1. Resolved Decisions & Defaults (from Section 14.1)

| # | Decision Item | Default in SPEC | Implementation / Config Flag | Status |
|---|---|---|---|---|
| D-01 | Product Name | `Taranga Tables` | `config.productName = "Taranga Tables"` | Implemented as default |
| D-02 | Table Cadence | `Weekly` | `config.tableCadence = "weekly"` | Configurable (weekly vs fortnightly) |
| D-03 | Deposit Amount & No-Show Policy | `₹200 refundable; policy undecided` | `config.depositAmountInr = 200`, `config.noShowPolicy = "forfeit_on_unexcused"` | Configurable; mock payments |
| D-04 | Age Assurance Provider | `SelfDeclaredStub` | `config.ageProvider = "self_declared_stub"` | Throws visible banner "NOT COMPLIANT FOR PRODUCTION" |
| D-05 | Check-in Instrument & Scoring | Placeholder config marked `TODO_CLINICAL_REVIEW` | `/config/checkin.json` with placeholder items | Implemented as data, band-only storage |
| D-06 | Helpline Numbers | Tele-MANAS (14416) & Emergency (112) | `config.helplines = { national: "14416", emergency: "112" }` | Marked for verification before launch |
| D-07 | Named Grievance Officer | None | `config.grievanceOfficer = "Pending Appointment (Taranga Legal Team)"` | Displayed neutrally |
| D-08 | Data Retention Periods | 90 days for screenings & notifications | `config.retentionDays = 90` | Purge job configured |
| D-09 | Host Free Text Feedback Visibility | No, unless member opts in | `config.shareFeedbackWithHostDefault = false` | Only visible when user explicitly ticks 'share with host' |
| D-10 | Venue Terms with Cafe | Unknown | Managed as manual notes in admin | No automated dependency |
| D-11 | Legal/Tax Status of Deposits | Mock only / manual UPI outside app | `PAYMENT_PROVIDER=mock` | Zero real financial transactions |
| D-12 | Photo and Video Policy | Opt-in consent (`content_photos`) default false | `consent_photos: false` by default | Enforced at onboarding |

---

## 2. Conflicts Between SPEC.md and Prompts / Reality

| Conflict ID | Sources | Resolution | Rationale |
|---|---|---|---|
| C-01 | Section 15 vs Sections 1-14 | Section 15 rules supersede | Section 15 verification log explicitly governs claims, numbers, and cautions (e.g. cumulative Hall numbers, no oxytocin/hormone language). |
| C-02 | Spec package manager (`pnpm`) | `pnpm` v12.15.0 installed and configured | Matches standard pnpm workflow specified in Section 11.4 & 13. |
