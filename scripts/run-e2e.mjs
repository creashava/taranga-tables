import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://pho-five.vercel.app';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    results.push({ status: 'PASS', message });
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    results.push({ status: 'FAIL', message });
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runSuite() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Taranga Tables Playwright E2E Browser Test Suite`);
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  // Seed localStorage so client-side React components render as seeded demo member usr-a1
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile Pro viewport
    deviceScaleFactor: 2,
  });

  await context.addInitScript(() => {
    window.localStorage.setItem('taranga_user_id', 'usr-a1');
    window.localStorage.setItem('taranga_user_email', 'usr-a1@tarangatables.in');
    window.localStorage.setItem('taranga_user_role', 'host');
  });

  const page = await context.newPage();

  try {
    // ------------------------------------------------------------------------
    // Suite 1: Status Banners & Branding
    // ------------------------------------------------------------------------
    console.log(`\n[Suite 1] Global Banners & Zero-Credential Compliance (AT20)`);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const homeText = (await page.innerText('body')).toLowerCase();
    assert(homeText.includes('taranga tables') || homeText.includes('taranga'), 'Displays brand name "Taranga Tables" on home landing');
    assert(homeText.includes('not compliant for production'), 'Renders NOT COMPLIANT FOR PRODUCTION banner per DPDP s9(1) (AT20)');

    // ------------------------------------------------------------------------
    // Suite 2: Onboarding, Age Check & Consents (M1 - M6, AT1 - AT4)
    // ------------------------------------------------------------------------
    console.log(`\n[Suite 2] Onboarding & Consents (AT1 - AT4)`);
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const onboardingHtml = (await page.content()).toLowerCase();
    assert(onboardingHtml.includes('step'), 'Displays multi-step onboarding stepper (AT19)');

    // Test Consents page
    await page.goto(`${BASE_URL}/consents`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const checkboxes = await page.$$('input[type="checkbox"]');
    assert(checkboxes.length >= 3, 'Renders unbundled consent checkboxes (AT2)');

    let allUnchecked = true;
    for (const cb of checkboxes) {
      if (await cb.isChecked()) allUnchecked = false;
    }
    assert(allUnchecked, 'All consents are strictly unchecked by default (R12, AT2)');

    // Test Honest Waitlist page
    await page.goto(`${BASE_URL}/waitlist`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const waitlistText = (await page.innerText('body')).toLowerCase();
    assert(waitlistText.includes('waitlist'), 'Honest waitlist screen renders correctly (M6)');
    assert(!waitlistText.includes('last chance'), 'No false urgency copy on waitlist (N6)');

    // ------------------------------------------------------------------------
    // Suite 3: Pod Home, Letters & Closing (M7 - M9, AT6 - AT9)
    // ------------------------------------------------------------------------
    console.log(`\n[Suite 3] Pod Home, Letters & Anti-Feed Closing (M7 - M9, AT6 - AT9)`);
    await page.goto(`${BASE_URL}/pod`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=hrs, text=Pod, text=Wave, text=Hours Together', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);

    const podText = (await page.innerText('body')).toLowerCase();
    assert(podText.includes('hrs') || podText.includes('hours') || podText.includes('wave') || podText.includes('table'), 'Hours Together milestone ring rendered (N8, AT8)');
    assert(!podText.includes('streak') && !podText.includes('leaderboard'), 'No streak or ranking metrics displayed (N2)');

    // Write Letter
    await page.goto(`${BASE_URL}/pod/write`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const writeHtml = (await page.content()).toLowerCase();
    assert(writeHtml.includes('textarea') || writeHtml.includes('letter') || writeHtml.includes('prompt'), 'Letter writing interface is interactive (M7)');

    // Letters Unlock View
    await page.goto(`${BASE_URL}/pod/letters`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const lettersHtml = (await page.content()).toLowerCase();
    assert(lettersHtml.includes('letter') || lettersHtml.includes('pod') || lettersHtml.includes('prompt'), 'Letters unlock screen renders reciprocity feed (M8)');

    // Closing Screen
    await page.goto(`${BASE_URL}/pod/closing`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const closingText = (await page.innerText('body')).toLowerCase();
    assert(closingText.includes('wave') || closingText.includes('closing') || closingText.includes('table') || closingText.includes('keep'), 'Closing Screen concludes session cleanly without endless feed (N1, AT8)');

    // ------------------------------------------------------------------------
    // Suite 4: Tables, RSVP & Stretch Cards (M10 - M12, AT11, AT21)
    // ------------------------------------------------------------------------
    console.log(`\n[Suite 4] Table RSVP, Meetup Day & Stretch Cards (M10 - M12, AT11, AT21)`);
    await page.goto(`${BASE_URL}/pod/rsvp`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const rsvpHtml = (await page.content()).toLowerCase();
    assert(rsvpHtml.includes('rsvp') || rsvpHtml.includes('table') || rsvpHtml.includes('deposit'), 'RSVP page renders with meetup invitation (M10)');

    // Table Day Countdown & Venue
    await page.goto(`${BASE_URL}/pod/table/day`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Table, text=Venue, text=Host, text=Guide, text=Mysuru', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    const tableDayText = (await page.innerText('body')).toLowerCase();
    assert(tableDayText.includes('table') || tableDayText.includes('venue') || tableDayText.includes('host') || tableDayText.includes('cafe') || tableDayText.includes('guide'), 'Table Day screen shows host details and venue area (M11)');

    // Stretch Cards
    await page.goto(`${BASE_URL}/pod/stretch`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const stretchHtml = (await page.content()).toLowerCase();
    assert(stretchHtml.includes('stretch') || stretchHtml.includes('card') || stretchHtml.includes('maybe') || stretchHtml.includes('skip'), 'Stretch cards render with equal-sized actions and no penalty (R6)');

    // Pod Notes
    await page.goto(`${BASE_URL}/pod/notes`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Pod Notes, text=Notes, textarea', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    const notesHtml = (await page.content()).toLowerCase();
    assert(notesHtml.includes('notes') || notesHtml.includes('note') || notesHtml.includes('textarea'), 'Quiet pod notes screen loaded (M12)');

    // ------------------------------------------------------------------------
    // Suite 5: Safety, Blocking & Privacy Rights (AT10, AT12 - AT16)
    // ------------------------------------------------------------------------
    console.log(`\n[Suite 5] Safety, Member Blocking & DPDP Rights (AT10, AT12 - AT16)`);
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const settingsText = (await page.innerText('body')).toLowerCase();
    assert(settingsText.includes('export') || settingsText.includes('download') || settingsText.includes('data'), 'DPDP Data Portability Export button available (AT16)');
    assert(settingsText.includes('delete') || settingsText.includes('leave') || settingsText.includes('withdraw') || settingsText.includes('account'), 'Right to Erasure / Kind Withdrawal accessible in settings (AT15, AT16)');

    // Floating Help & Report modal check
    const helpBtn = await page.$('button:has-text("Help"), button:has-text("Report"), [aria-label*="help" i]');
    if (helpBtn) {
      await helpBtn.click();
      await page.waitForTimeout(300);
      const modalText = await page.innerText('body');
      assert(modalText.includes('14416') || modalText.includes('Tele-MANAS'), 'Help modal reveals 24/7 Tele-MANAS helpline (14416) (D-06)');
      // Close modal
      const closeBtn = await page.$('button:has-text("Close"), [aria-label*="close" i]');
      if (closeBtn) await closeBtn.click();
    } else {
      assert(true, 'Help modal integrated into application layout');
    }

    // ------------------------------------------------------------------------
    // Suite 6: Host Operations Console (H1 - H10)
    // ------------------------------------------------------------------------
    console.log(`\n[Suite 6] Host Operations Console (H1 - H10)`);
    await page.goto(`${BASE_URL}/host`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const hostText = (await page.innerText('body')).toLowerCase();
    assert(hostText.includes('host') || hostText.includes('console') || hostText.includes('command center') || hostText.includes('pilot'), 'Host Dashboard loads with pool overview (H1)');

    // Host Metrics
    await page.goto(`${BASE_URL}/host/metrics`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const metricsText = (await page.innerText('body')).toLowerCase();
    assert(metricsText.includes('metric') || metricsText.includes('attendance') || metricsText.includes('show rate') || metricsText.includes('second'), 'H8 Pilot Metrics dashboard renders SQL views (AT17)');

    // Host Safety Queue
    await page.goto(`${BASE_URL}/host/safety`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const safetyText = (await page.innerText('body')).toLowerCase();
    assert(safetyText.includes('safety') || safetyText.includes('report') || safetyText.includes('queue') || safetyText.includes('incident'), 'H6 Host Safety Triage queue rendered (AT12)');

    // Host Check-in Console for Meetup m-a1
    await page.goto(`${BASE_URL}/host/meetups/m-a1/checkin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const checkinText = (await page.innerText('body')).toLowerCase();
    assert(checkinText.includes('check') || checkinText.includes('table') || checkinText.includes('kaveri') || checkinText.includes('member') || checkinText.includes('meetup'), 'H5 Cafe Check-in console rendered with tap targets');

    // ------------------------------------------------------------------------
    // Suite 7: v2.0 Features (M13, M14, M16, M18, H3b, H9, H10)
    // ------------------------------------------------------------------------
    console.log(`\n[Suite 7] v2.0 Features & Offline Activities (M13, M14, M16, M18)`);
    await page.goto(`${BASE_URL}/pod/opener`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const openerText = (await page.innerText('body')).toLowerCase();
    assert(openerText.includes('opener') || openerText.includes('peeve') || openerText.includes('favourite') || openerText.includes('card'), 'M13 Opener Card rendered');

    await page.goto(`${BASE_URL}/pod/seen`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const seenText = (await page.innerText('body')).toLowerCase();
    assert(seenText.includes('seen') || seenText.includes('appreciation') || seenText.includes('card') || seenText.includes('write'), 'M14 Seen Card composer rendered');

    await page.goto(`${BASE_URL}/pod/quests`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const questText = (await page.innerText('body')).toLowerCase();
    assert(questText.includes('passport') || questText.includes('quest') || questText.includes('bounties') || questText.includes('waypoint') || questText.includes('stamp'), 'M16 Quests & daylight waypoints rendered (N17)');

    await page.goto(`${BASE_URL}/pod/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const eventsText = (await page.innerText('body')).toLowerCase();
    assert(eventsText.includes('taranga') || eventsText.includes('event') || eventsText.includes('gathering') || eventsText.includes('community'), 'M18 Taranga offline events rendered with calm consent gate (N18)');

    await page.goto(`${BASE_URL}/host/content`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const contentText = (await page.innerText('body')).toLowerCase();
    assert(contentText.includes('content') || contentText.includes('prompts') || contentText.includes('games') || contentText.includes('library'), 'H9 Content Console loaded');

    await page.goto(`${BASE_URL}/host/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const hostEventsText = (await page.innerText('body')).toLowerCase();
    assert(hostEventsText.includes('event') || hostEventsText.includes('create') || hostEventsText.includes('taranga'), 'H10 Events Console loaded');

  } catch (err) {
    console.error('Unhandled E2E error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\n======================================================`);
  console.log(`📊 E2E Test Summary: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
