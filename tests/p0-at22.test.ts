import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('AT22: Claims Discipline and Claim ID Verification', () => {
  const claimsPath = path.resolve(process.cwd(), 'config/claims.json');

  it('contains verified claims PS-01 through PS-12 from Section 15.1', () => {
    expect(fs.existsSync(claimsPath)).toBe(true);
    const claims = JSON.parse(fs.readFileSync(claimsPath, 'utf8'));
    const ids = claims.map((c: { id: string }) => c.id);

    expect(ids).toContain('PS-01');
    expect(ids).toContain('PS-02');
    expect(ids).toContain('PS-03');
    expect(ids).toContain('PS-06');
    expect(ids).toContain('PS-12');
  });

  it('passes claims lint on clean codebase', () => {
    const result = execSync('node scripts/lint-claims.mjs', { encoding: 'utf8' });
    expect(result).toContain('Claims Discipline Lint PASSED');
  });

  it('fails CI when a statistic or percentage is used without a claim ID', () => {
    const tempFile = path.resolve(process.cwd(), 'components/UntiedStatComponent.tsx');
    try {
      fs.writeFileSync(
        tempFile,
        'export const BadStat = () => <div>Did you know 85% of people feel happier offline?</div>;',
        'utf8'
      );
      expect(() => {
        execSync('node scripts/lint-claims.mjs', { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  it('fails CI when an unapproved study citation is made without a claim ID', () => {
    const tempFile = path.resolve(process.cwd(), 'components/UntiedStudyComponent.tsx');
    try {
      fs.writeFileSync(
        tempFile,
        'export const BadStudy = () => <div>Hall 2018 proved you need 200 hours.</div>;',
        'utf8'
      );
      expect(() => {
        execSync('node scripts/lint-claims.mjs', { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
