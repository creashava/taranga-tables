#!/usr/bin/env node
// scripts/supabase-migrate.mjs
// Applies database migrations to a local or remote Supabase instance.

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const migrationFile = resolve(process.cwd(), 'supabase/migrations/0001_init.sql');
const seedFile = resolve(process.cwd(), 'supabase/seed.sql');

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

console.log('='.repeat(70));
console.log('  Taranga Tables — Supabase Database Migration & Seeding');
console.log('='.repeat(70));

if (!existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`);
  process.exit(1);
}

// 1. If DATABASE_URL is set, attempt psql
if (dbUrl) {
  console.log(`📡 Found database connection string: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
  try {
    console.log('⏳ Executing migration via psql...');
    execSync(`psql "${dbUrl}" -f "${migrationFile}"`, { stdio: 'inherit' });
    console.log('✅ Migration executed successfully.');

    if (process.argv.includes('--seed') && existsSync(seedFile)) {
      console.log('⏳ Executing seed data via psql...');
      execSync(`psql "${dbUrl}" -f "${seedFile}"`, { stdio: 'inherit' });
      console.log('✅ Seed data inserted successfully.');
    }
    process.exit(0);
  } catch (err) {
    console.warn('⚠️ psql execution failed or psql is not in PATH. Falling back to CLI / manual instructions.\n');
  }
}

// 2. If Supabase CLI is installed
try {
  const version = execSync('supabase --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  console.log(`⚡ Detected Supabase CLI (${version})`);
  console.log('⏳ Pushing database migrations...');
  execSync('supabase db push', { stdio: 'inherit' });
  console.log('✅ Migrations pushed via Supabase CLI.');
  process.exit(0);
} catch {
  // Supabase CLI not installed
}

// 3. Fallback: Provide clear, turnkey instructions
console.log('\n💡 Turnkey Manual Migration Instructions:');
console.log('------------------------------------------------------------');
console.log('To apply migrations to your Supabase project:');
console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project -> "SQL Editor" -> "New query"');
console.log(`3. Copy & paste the contents of:\n   ${migrationFile}`);
console.log('4. Click "Run"');
console.log('5. (Optional) For seed data, paste the contents of:\n   ' + seedFile);
console.log('------------------------------------------------------------');
console.log('Or with psql / CLI:');
console.log('   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" pnpm db:migrate');
console.log('   supabase link --project-ref [YOUR_REF] && supabase db push');
console.log('='.repeat(70));
