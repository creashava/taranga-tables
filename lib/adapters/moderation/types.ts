export interface ModerationResult {
  flagged: boolean;
  priority: 'none' | 'normal' | 'high';
  isSelfHarmRisk: boolean;
  matchedKeywords: string[];
  hostActionRequired: boolean;
  userMessage?: string;
}

export interface ModerationAdapter {
  checkContent(text: string): ModerationResult;
}
