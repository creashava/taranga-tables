# Taranga Tables Operational Runbook

Operational and incident response guidelines for the Mysuru pilot prototype.
Last updated: October 2026. Status: PROVISIONAL — review before production launch.

---

## 1. Quick Start & Local Development

```bash
# Install dependencies
pnpm install

# Seed demo data (12 users, 2 pods, prompts, games, waypoints, events)
pnpm seed:demo

# Start development server
pnpm dev

# Run all acceptance tests (93 tests across 11 files)
pnpm test

# Run strict banned-phrase & claims discipline lints (AT18 & AT22)
pnpm lint

# Run TypeScript type check
pnpm exec tsc --noEmit

# Production build verification
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) — the app runs with **zero external credentials** in MOCK MODE.

---

## 2. Production & Staging Deployments

### 2.1 Supabase Setup & Database Migrations

#### Option A: One-Click SQL Editor (Fastest)
1. Create a new Supabase project at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** → **New query**.
3. Copy and run the canonical v2.0 schema:
   - File: [`supabase/migrations/0001_init.sql`](file:///c:/Users/Varun%20m/Desktop/pho/supabase/migrations/0001_init.sql)
4. (Optional) For pilot seed data, copy and run:
   - File: [`supabase/seed.sql`](file:///c:/Users/Varun%20m/Desktop/pho/supabase/seed.sql)

#### Option B: Automated CLI / Connection String
```bash
# Set your Supabase connection string from Project Settings → Database
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres"

# Run automated migration
pnpm db:migrate

# Or apply migrations with seed data
pnpm db:seed
```

#### Option C: Supabase CLI
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

---

### 2.2 Vercel Deployment

The repository includes preconfigured [`vercel.json`](file:///c:/Users/Varun%20m/Desktop/pho/vercel.json) with automated hourly cron triggers and security headers.

#### Option A: Vercel Web Dashboard (Recommended)
1. Push your repository to GitHub / GitLab.
2. In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New** → **Project** → Import this repository.
3. Framework Preset: **Next.js** (automatically detected).
4. Build Command: `pnpm build` (default).
5. Configure Environment Variables in the project settings:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PAYMENT_PROVIDER=mock
   AGE_PROVIDER=self_declared_stub
   NOTIFY_PROVIDER=console
   MODERATION_PROVIDER=keyword
   APP_TIMEZONE=Asia/Kolkata
   NEXT_PUBLIC_APP_TIMEZONE=Asia/Kolkata
   MOCK_MODE=true
   NEXT_PUBLIC_MOCK_MODE=true
   CRON_SECRET=your_secure_cron_secret_token
   ```
6. Click **Deploy**.
7. Vercel automatically registers the hourly cron job from `vercel.json` hitting `/api/jobs/tick` with `CRON_SECRET`.

#### Option B: Vercel CLI
```bash
pnpm dlx vercel
pnpm dlx vercel --prod
```

---

### 2.3 Render Deployment

The repository includes a ready-to-deploy Blueprint specification ([`render.yaml`](file:///c:/Users/Varun%20m/Desktop/pho/render.yaml)) and an optimized production [`Dockerfile`](file:///c:/Users/Varun%20m/Desktop/pho/Dockerfile).

#### Option A: Render Blueprint (Infrastructure-as-Code)
1. Push this repository to GitHub / GitLab.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect this repository. Render automatically reads `render.yaml` and sets up:
   - **`taranga-tables`**: Web service running Next.js (`pnpm install && pnpm build` → `pnpm start`) with health checks at `/api/jobs/tick`.
   - **`taranga-hourly-tick`**: Cron worker running `node scripts/trigger-tick.mjs` every hour (`0 * * * *`).
5. Fill in any required environment secrets (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).
6. Click **Apply Blueprint**.

#### Option B: Render Web Service via Docker
1. In Render Dashboard, click **New +** → **Web Service**.
2. Select **Docker** environment.
3. Render automatically uses the multi-stage [`Dockerfile`](file:///c:/Users/Varun%20m/Desktop/pho/Dockerfile).
4. Set port to `3000` and add environment variables from `.env.example`.

---

### 2.4 Verification After Deployment

Verify your deployment is fully operational:
```bash
# 1. Health check & cron tick endpoint
curl -X GET https://your-deployment-url/api/jobs/tick \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 2. Verify Member Hub & Onboarding
curl -I https://your-deployment-url/
curl -I https://your-deployment-url/onboarding

# 3. Verify Host Console
curl -I https://your-deployment-url/host
```


---

## 3. Backup & Data Retention

### 3.1 Supabase Backups
- Supabase Pro tier: daily automated backups (7-day retention)
- Free tier: manual exports only — run weekly during pilot:
  ```bash
  pg_dump "$DATABASE_URL" -F c -f backup-$(date +%Y%m%d).dump
  ```

### 3.2 Data Retention Policy (D5)
Per `config/flags.json` → `D5_data_retention_days: 90`:
- Letters and pod notes: **deleted 90 days after Wave end date**
- Screenings: **deleted 90 days after Wave end date** (raw answers are never stored)
- Notifications: **deleted 90 days after Wave end date**
- Audit logs: **retained indefinitely** (no PII in audit logs)
- Profiles: **retained until user requests deletion** (`DELETE /api/me`)

Run retention purge after each Wave:
```sql
-- Run at Wave + 90 days
DELETE FROM letters WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM pod_notes WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM screenings WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM notification_records WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 4. Incident Response & Safety Breaches

### 4.1 High-Severity Safety Report Workflow (AT12)
1. **Trigger**: Member files a high-severity report via `HelpReportButton` or `/api/report`
2. **Alert**: System logs to console and emails `host@tarangatables.in` within 1 minute
3. **Queue**: Report tops the H6 Safety Queue at `/host/safety`
4. **Action**:
   - Host reviews report context immediately
   - If physical safety or harassment: host pauses member's table attendance
   - Host contacts member personally within 24 hours
   - If emergency: coordinate with **Tele-MANAS (14416)** or **National Emergency (112)**
   - Host logs resolution in `/host/safety` to close the ticket

### 4.2 Data Security Incident Protocol (DPDP Section 9.4)
1. **Immediately** isolate affected services (disable Supabase project or restrict RLS)
2. Review audit logs (`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500`)
3. Under DPDP: notify the **Data Protection Board of India** and affected data principals promptly
4. Contact Taranga Legal Team (see `config/settings.json` → `grievanceOfficer`)

### 4.3 Self-Harm Keyword Detection (AT14)
- Any letter containing flagged keywords is held in `status: 'held'`
- User immediately sees supportive helpline copy (Tele-MANAS: 14416)
- Host receives a follow-up task in `/host/followups`
- Letter content is **never logged** or sent to any external service

---

## 5. Minimum Table Rule (AT21, N16)

If fewer than 4 confirmed `yes` RSVPs exist 24 hours before a meetup:
1. The cron tick (`/api/jobs/tick`) creates a `low_turnout` host task
2. Host reviews `/host/pods/[id]/meetups`
3. Host reschedules or merges with another pod's table
4. Members receive a **neutral, no-guilt** schedule update via the daily digest

---

## 6. Pilot Day Checklist

Use this checklist on the day of each Table session:

### 6.1 Morning Prep (1–2 hours before)
- [ ] Verify venue is confirmed and host has contact info
- [ ] Check RSVP count at `/host/pods/[id]/meetups` — confirm ≥ 4 yes RSVPs
- [ ] Charge all host devices; download offline copy of host kit PDF
- [ ] Print Letter Box cards for any members without phones (from `/host/pods/[id]/print`)
- [ ] Confirm `HelpReportButton` is working on at least one test device
- [ ] Check `/host/safety` queue — resolve any open tickets before the session

### 6.2 At the Venue (Table Day)
- [ ] Set up a phone basket (phones in basket rule)
- [ ] Walk through Table 1 Opener cards (`/pod/opener` — Peeve or Favourite arm per pod config)
- [ ] Use Check-In console (`/host/meetups/[id]/checkin`) to mark arrivals
- [ ] Note anyone marked as no-show — deposit auto-hold, no extra action needed
- [ ] If <4 arrive: initiate the reschedule workflow per Section 5 above

### 6.3 After the Session
- [ ] Mark meetup as `done` via host console
- [ ] Complete any follow-up tasks in `/host/followups`
- [ ] Send one neutral daily digest notification (system handles automatically)
- [ ] Review H8 Metrics dashboard (`/host/metrics`) for attendance and show rates

### 6.4 Day 28 (Wave Close)
- [ ] Confirm pod status transitions to `closing` (cron tick handles this)
- [ ] Members see Taranga Events card (`/pod/events`) with max 2 events
- [ ] Check event interest signups in `/host/events`
- [ ] Collect Wave Feedback via the Closing Screen
- [ ] Run data export for all members who request it (`GET /api/me/export`)
- [ ] Schedule retention purge 90 days from today (see Section 3.2)

---

## 7. Demo Reset

To reset the prototype to a clean seed state at any time:
```bash
pnpm seed:demo
# or
pnpm demo:reset
```
This re-seeds all 12 demo users, 2 pods, prompts, games, waypoints, and Taranga events.

---

## 8. Contacts & Escalation

| Role | Contact | Notes |
|---|---|---|
| Taranga Host | host@tarangatables.in | All safety reports go here automatically |
| Tele-MANAS (Mental Health Helpline) | 14416 | National 24/7 helpline — shown in app |
| National Emergency | 112 | Shown in app |
| Grievance Officer | Pending Appointment (Taranga Legal Team) | Update `config/settings.json` before launch |
| Data Protection Board of India | https://dpboard.gov.in | For DPDP breach notifications |
