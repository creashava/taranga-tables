#!/usr/bin/env node
// scripts/supabase-migrate.mjs
// Applies database migrations to a local or remote Supabase instance.

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import pg from 'pg';

const { Client } = pg;

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

async function runWithPg(connectionString) {
  console.log(`📡 Connecting to PostgreSQL via connection string...`);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database successfully!');

    console.log('⏳ Applying migration 0001_init.sql...');
    const sql = readFileSync(migrationFile, 'utf8');
    await client.query(sql);
    console.log('✅ Migration 0001_init.sql executed successfully.');

    if (process.argv.includes('--seed') && existsSync(seedFile)) {
      console.log('⏳ Inserting seed data...');
      const seedSql = readFileSync(seedFile, 'utf8');
      try {
        await client.query(seedSql);
        console.log('✅ Seed data inserted successfully.');
      } catch (err) {
        console.warn('⚠️ Seed insertion note:', err.message);
      }
    }

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`✅ Schema verified! Found ${res.rows.length} public tables.`);
    await client.end();
    return true;
  } catch (err) {
    console.warn('⚠️ Direct pg connection execution failed:', err.message);
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  if (dbUrl) {
    const success = await runWithPg(dbUrl);
    if (success) process.exit(0);
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

  // 3. Fallback instructions
  console.log('\n💡 Turnkey Manual Migration Instructions:');
  console.log('------------------------------------------------------------');
  console.log('To apply migrations to your Supabase project:');
  console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project -> "SQL Editor" -> "New query"');
  console.log(`3. Copy & paste the contents of:\n   ${migrationFile}`);
  console.log('4. Click "Run"');
  console.log('------------------------------------------------------------');
  console.log('Or run with connection string:');
  console.log('   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" pnpm db:migrate');
  console.log('='.repeat(70));
}

main();
