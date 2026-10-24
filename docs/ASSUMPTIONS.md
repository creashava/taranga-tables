# ASSUMPTIONS.md

This document tracks all operational and engineering assumptions made during the implementation of the Taranga Tables pilot prototype.

---

## 1. Technical & Environment Assumptions

1. **Zero-Credential Default**: The app runs fully offline and locally without requiring active external Supabase, Resend, Razorpay, or Twilio/WhatsApp credentials. All external services default to local mock adapters.
2. **Postgres & In-Memory / Local Supabase**: When Supabase is not running or credentials are not supplied, the application falls back smoothly to an in-memory or SQLite/local mock adapter to satisfy AT20 ("Given a fresh clone with no credentials, then the app runs and shows both MOCK MODE and NOT COMPLIANT FOR PRODUCTION banners").
3. **Timezone**: All calculations, scheduling, and reveal timings operate with `Asia/Kolkata` (UTC+5:30) as the reference timezone.
4. **Mobile Baseline**: The primary member PWA targets a 360px viewport width, styled with Tailwind and accessible components compliant with WCAG AA.

---

## 2. Domain & Workflow Assumptions

1. **Host-in-the-Loop Matching**: Matching algorithms produce proposals for 5-7 members (default 6) based on Section 6 criteria; the host approves or edits before any pod assignment occurs.
2. **Slow Reveal Schedule**: Letter reveal time is calculated as the next occurrence of the member's configured `letter_hour` after both author and reader have submitted their letters for sequence N.
3. **Data Minimisation**: No Date of Birth (DOB) or raw phone numbers are collected or stored in the database. Raw responses to clinical check-in questions are discarded immediately after computing the triage band (`none`, `mild`, `elevated`).
4. **Helpline & Crisis Support**: In the event of an elevated screening band or self-harm keyword detection in letters, the user is immediately shown supportive helpline numbers (Tele-MANAS: 14416, Emergency: 112) and the host is alerted without auto-deletion.
