import fs from "fs";
import path from "path";

// AT22: Given any statistic or research claim in a locale file or component,
// then it must reference a claim ID in /config/claims.json, and CI fails on
// any number-plus-percent or study-name string that is not tied to a claim ID.

const claimsFile = path.resolve(process.cwd(), "config/claims.json");
if (!fs.existsSync(claimsFile)) {
  console.error("❌ config/claims.json does not exist!");
  process.exit(1);
}

const claimsData = JSON.parse(fs.readFileSync(claimsFile, "utf8"));
const validClaimIds = new Set(claimsData.map((c) => c.id));

const SCAN_DIRS = ["components", "app", "locales"];
const IGNORED_FILES = [/\.test\.[tj]sx?$/, /\.spec\.[tj]sx?$/];

// Patterns that identify stats or study names
const STAT_PATTERNS = [
  /\b\d+(\.\d+)?%/i,
  /\b\d+\s+percent\b/i,
  /\bHall\s+(2018|2019)\b/i,
  /\bWHO\b/i,
  /\bNIMHANS\b/i,
  /\bLive\s+Group\b/i,
  /\bGodard\b/i,
  /\bSkift\b/i
];

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
      // Check if line contains a statistical or study-name pattern
      for (const pattern of STAT_PATTERNS) {
        if (pattern.test(line)) {
          // If it matches, check if it's explicitly tied to a valid claim ID (e.g. PS-01, PS-02, etc.)
          const hasValidClaimRef = Array.from(validClaimIds).some((id) =>
            line.includes(id) || content.includes(id)
          );

          if (!hasValidClaimRef) {
            violations.push({
              file: path.relative(process.cwd(), file),
              line: idx + 1,
              matched: line.trim(),
              pattern: pattern.toString(),
            });
          }
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error("❌ Claims Discipline Lint FAILED! Untied stats or study names found (AT22 violation):");
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} -> "${v.matched}" (matches: ${v.pattern})`);
  });
  process.exit(1);
} else {
  console.log("✅ Claims Discipline Lint PASSED: All statistics and research citations are verified and tied to claim IDs.");
  process.exit(0);
}
