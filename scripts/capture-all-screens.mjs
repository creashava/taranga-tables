import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://pho-five.vercel.app';
const OUT_DIR = path.resolve('docs/screens');

const BREAKPOINTS = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
];

const SCREENS = [
  // Phase P2: Onboarding (M1-M6)
  { id: 'm1_landing', phase: 'p2', path: '/signin', title: 'Landing / Sign-in' },
  { id: 'm3_onboarding', phase: 'p2', path: '/onboarding', title: 'Onboarding Stepper' },
  { id: 'm4_consents', phase: 'p2', path: '/consents', title: 'Consents' },
  { id: 'm6_waitlist', phase: 'p2', path: '/waitlist', title: 'Waitlist' },

  // Phase P4: Letters & Closing (M7-M9)
  { id: 'm7_pod_home', phase: 'p4', path: '/pod', title: 'Pod Home' },
  { id: 'm7_write_letter', phase: 'p4', path: '/pod/write', title: 'Write Letter' },
  { id: 'm8_letters_unlock', phase: 'p4', path: '/pod/letters', title: 'Letters (Unlock)' },
  { id: 'm9_closing_screen', phase: 'p4', path: '/pod/closing', title: 'Closing Screen' },

  // Phase P5: Tables & Meetups (M10-M12, H4-H5)
  { id: 'm10_rsvp', phase: 'p5', path: '/pod/rsvp', title: 'RSVP' },
  { id: 'm11_table_day', phase: 'p5', path: '/pod/table/day', title: 'Table Day' },
  { id: 'm12_stretch_cards', phase: 'p5', path: '/pod/stretch', title: 'Stretch Cards' },
  { id: 'm12_pod_notes', phase: 'p5', path: '/pod/notes', title: 'Pod Notes' },
  { id: 'h5_host_checkin', phase: 'p5', path: '/host/meetups/m-kaveri-1/checkin', title: 'Host Check-in' },

  // Phase P7: Polish (H8)
  { id: 'h8_host_metrics', phase: 'p7', path: '/host/metrics', title: 'Host Metrics' },
  { id: 'h6_host_safety', phase: 'p7', path: '/host/safety', title: 'Host Safety Queue' },
  { id: 'm15_settings', phase: 'p7', path: '/settings', title: 'Settings' },

  // Phase P8: v2.0 Features (M13, M14, M16, M18, H3b, H9, H10)
  { id: 'm13_opener_card', phase: 'p8', path: '/pod/opener', title: 'Opener Card' },
  { id: 'm14_seen_cards', phase: 'p8', path: '/pod/seen', title: 'Seen Cards' },
  { id: 'm16_quests_passport', phase: 'p8', path: '/pod/quests', title: 'Quests & Passport' },
  { id: 'm18_taranga_events', phase: 'p8', path: '/pod/events', title: 'From Taranga Events' },
  { id: 'h3b_letter_box_print', phase: 'p8', path: '/host/pods/pod-a/print', title: 'Letter Box Print' },
  { id: 'h9_content_console', phase: 'p8', path: '/host/content', title: 'Content Console' },
  { id: 'h10_events_console', phase: 'p8', path: '/host/events', title: 'Events Console' },
];

async function capture() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log(`Starting automated screenshot capture across ${SCREENS.length} screens and ${BREAKPOINTS.length} breakpoints...`);
  console.log(`Target URL base: ${BASE_URL}\n`);

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const capturedList = [];

  for (const bp of BREAKPOINTS) {
    console.log(`\n--- Capturing Breakpoint: ${bp.name} (${bp.width}x${bp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const screen of SCREENS) {
      const filename = `${screen.phase}_${screen.id}_${bp.name}.png`;
      const filepath = path.join(OUT_DIR, filename);
      const url = `${BASE_URL}${screen.path}`;

      try {
        process.stdout.write(`  [${bp.name}] ${screen.title} (${screen.path}) ... `);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 6000 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`✓ Saved ${filename}`);
        capturedList.push({ screen, bp, filename });
      } catch (err) {
        console.log(`⚠ Warning: ${err.message}`);
        try {
          await page.screenshot({ path: filepath });
          console.log(`  ✓ Fallback saved ${filename}`);
          capturedList.push({ screen, bp, filename });
        } catch {
          console.error(`  ✗ Failed to capture ${filename}`);
        }
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\n🎉 Capture complete! Total screenshots: ${capturedList.length}`);
}

capture().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
