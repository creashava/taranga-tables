import { AgeAssuranceAdapter, AgeVerificationResult } from './types';

export class SelfDeclaredStub implements AgeAssuranceAdapter {
  async verify(userDeclaration: { is18PlusDeclared: boolean; userId?: string }): Promise<AgeVerificationResult> {
    const is18Plus = Boolean(userDeclaration.is18PlusDeclared);
    return {
      is18Plus,
      method: 'self_declared_stub',
      compliantForProduction: false,
      checkedAt: new Date().toISOString(),
      warning: 'Self-declaration stub used. NOT COMPLIANT FOR PRODUCTION under DPDP Act requirements.',
    };
  }
}
