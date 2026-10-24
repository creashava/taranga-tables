import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('AT18: Banned Phrase Lint', () => {
  it('passes on the clean codebase', () => {
    const result = execSync('node scripts/lint-banned-phrases.mjs', { encoding: 'utf8' });
    expect(result).toContain('Banned Phrase Lint PASSED');
  });

  it('fails when a banned phrase is present in components or locale files', () => {
    const tempFile = path.resolve(process.cwd(), 'components/TestViolation.tsx');
    try {
      fs.writeFileSync(
        tempFile,
        'export const BadComponent = () => <div>Hurry! It is your last chance to join!</div>;',
        'utf8'
      );
      expect(() => {
        execSync('node scripts/lint-banned-phrases.mjs', { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  it('fails when prohibited hormone claims (oxytocin / dopamine) are present', () => {
    const tempFile = path.resolve(process.cwd(), 'components/TestHormoneViolation.tsx');
    try {
      fs.writeFileSync(
        tempFile,
        'export const BadHormone = () => <div>Experience oxytocin release at our tables!</div>;',
        'utf8'
      );
      expect(() => {
        execSync('node scripts/lint-banned-phrases.mjs', { encoding: 'utf8', stdio: 'pipe' });
      }).toThrow();
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
