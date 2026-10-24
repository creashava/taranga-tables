import { AgeAssuranceAdapter } from './types';
import { SelfDeclaredStub } from './stub';

export * from './types';
export * from './stub';

let ageAdapterInstance: AgeAssuranceAdapter | null = null;

export function getAgeAssuranceAdapter(): AgeAssuranceAdapter {
  if (!ageAdapterInstance) {
    const provider = process.env.AGE_PROVIDER || 'self_declared_stub';
    if (provider === 'self_declared_stub') {
      ageAdapterInstance = new SelfDeclaredStub();
    } else {
      console.warn(`[AGE] Provider "${provider}" not implemented; defaulting to SelfDeclaredStub.`);
      ageAdapterInstance = new SelfDeclaredStub();
    }
  }
  return ageAdapterInstance;
}
