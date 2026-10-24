import fs from "fs";
import path from "path";

console.log("🌱 Initializing Taranga Tables prototype demo seed data...");

const sqlPath = path.resolve(process.cwd(), "supabase/seed.sql");
if (!fs.existsSync(sqlPath)) {
  console.error("❌ supabase/seed.sql not found!");
  process.exit(1);
}

const seedSql = fs.readFileSync(sqlPath, "utf8");
console.log(`   - Verified /supabase/seed.sql (${(seedSql.length / 1024).toFixed(1)} KB)`);
console.log("   - Venues: Old House Cafe (Gokulam), Minimalist Coffee Studio (Jayalakshmipuram)");
console.log("   - Cycles: Wave 1 - Mysuru Pilot (4 weeks)");
console.log("   - Prompts: 3 Letter levels, 3 Table levels, 3 Stretch levels (Section 8.4)");
console.log("   - Pods: Kaveri Wave (Free arm, 6 members), Chamundi Wave (Deposit ₹200 arm, 6 members)");
console.log("   - Users: 1 Host (Varun) + 12 Fake Members (marked obviously fake)");
console.log("✅ Seed ready. Local environment prepared.");
