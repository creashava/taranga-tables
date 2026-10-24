import fs from "fs";
import path from "path";

// Banned phrases from Section 8.3, R7, and Section 15
const BANNED_PATTERNS = [
  /last\s+chance/i,
  /only\s+\d+\s+left/i,
  /you['’]?re\s+missing\s+out/i,
  /don['’]?t\s+let\s+them\s+down/i,
  /don['’]?t\s+let\s+your\s+pod\s+down/i,
  /your\s+streak/i,
  /\b\d+\s+people\s+are\s+waiting\b/i,
  /\bpeople\s+are\s+waiting\b/i,
  // Section 1.3 & Hard Rule 4: Hormone & dopamine claims
  /\boxytocin\b/i,
  /\bdopamine\b/i,
  /\bdopamine\s+hijack\b/i,
  /\bcure\s+loneliness\b/i
];

const SCAN_DIRS = ["components", "app", "locales"];
const IGNORED_FILES = [/\.test\.[tj]sx?$/, /\.spec\.[tj]sx?$/];

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else {
      if (IGNORED_FILES.some((pattern) => pattern.test(file))) continue;
      if (/\.(tsx|ts|jsx|js|json)$/.test(file)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

let violations = [];

for (const dir of SCAN_DIRS) {
  const files = getFiles(path.resolve(process.cwd(), dir));
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      // Skip comments referencing the lint rule itself if any
      if (line.includes("BANNED_PATTERNS") || line.includes("lint-banned-phrases")) return;
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), file),
            line: idx + 1,
            matched: line.trim(),
            pattern: pattern.toString(),
          });
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error("❌ Banned Phrase Lint FAILED! Found prohibited phrases (AT18 violation):");
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} -> "${v.matched}" (pattern: ${v.pattern})`);
  });
  process.exit(1);
} else {
  console.log("✅ Banned Phrase Lint PASSED: No prohibited phrases found in components, app, or locales.");
  process.exit(0);
}
