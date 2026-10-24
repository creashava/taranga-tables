import { ModerationAdapter, ModerationResult } from './types';

export class KeywordModerator implements ModerationAdapter {
  // Self-harm keywords trigger high-priority alerts with supportive helpline messaging (AT14)
  private selfHarmKeywords = [
    'suicide',
    'kill myself',
    'end my life',
    'self harm',
    'hurt myself',
    'want to die',
    'cutting myself'
  ];

  // Unsafe / violation keywords that flag for host review without auto-deleting
  private flagKeywords = [
    'dating',
    'hookup',
    'crypto',
    'invest now',
    'dm me privately',
    'whatsapp me on',
    'sell you',
    'buy this'
  ];

  checkContent(text: string): ModerationResult {
    const lower = text.toLowerCase();
    const selfHarmMatches = this.selfHarmKeywords.filter((kw) => lower.includes(kw));
    const flagMatches = this.flagKeywords.filter((kw) => lower.includes(kw));

    if (selfHarmMatches.length > 0) {
      return {
        flagged: true,
        priority: 'high',
        isSelfHarmRisk: true,
        matchedKeywords: selfHarmMatches,
        hostActionRequired: true,
        userMessage: 'If you are going through a difficult time, support is available. Tele-MANAS (14416) provides 24/7 free and confidential mental health support; in an emergency call 112.',
      };
    }

    if (flagMatches.length > 0) {
      return {
        flagged: true,
        priority: 'normal',
        isSelfHarmRisk: false,
        matchedKeywords: flagMatches,
        hostActionRequired: true,
      };
    }

    return {
      flagged: false,
      priority: 'none',
      isSelfHarmRisk: false,
      matchedKeywords: [],
      hostActionRequired: false,
    };
  }
}
