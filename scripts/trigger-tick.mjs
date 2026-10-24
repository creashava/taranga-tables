#!/usr/bin/env node
// scripts/trigger-tick.mjs
// Triggers the hourly /api/jobs/tick cron endpoint from external schedulers or Render cron workers.

const appUrl = process.env.APP_URL 
  ? (process.env.APP_URL.startsWith('http') ? process.env.APP_URL : `https://${process.env.APP_URL}`)
  : 'http://localhost:3000';

const cronSecret = process.env.CRON_SECRET || 'dev_cron_secret';

async function run() {
  const endpoint = `${appUrl}/api/jobs/tick`;
  console.log(`[TICK CRON] Triggering ${endpoint}...`);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const status = res.status;
    const body = await res.text();
    console.log(`[TICK CRON] Response (${status}): ${body}`);

    if (!res.ok) {
      console.error(`[TICK CRON] Failed with status ${status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`[TICK CRON] Request error:`, err);
    process.exit(1);
  }
}

run();
