export interface AgeVerificationResult {
  is18Plus: boolean;
  method: string;
  compliantForProduction: boolean;
  checkedAt: string;
  warning?: string;
}

export interface AgeAssuranceAdapter {
  verify(userDeclaration: { is18PlusDeclared: boolean; userId?: string }): Promise<AgeVerificationResult>;
}
