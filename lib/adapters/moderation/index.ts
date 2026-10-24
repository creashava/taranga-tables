import { ModerationAdapter } from './types';
import { KeywordModerator } from './keyword';

export * from './types';
export * from './keyword';

let moderationAdapterInstance: ModerationAdapter | null = null;

export function getModerationAdapter(): ModerationAdapter {
  if (!moderationAdapterInstance) {
    const provider = process.env.MODERATION_PROVIDER || 'keyword';
    if (provider === 'keyword') {
      moderationAdapterInstance = new KeywordModerator();
    } else {
      console.warn(`[MODERATION] Provider "${provider}" not implemented; defaulting to KeywordModerator.`);
      moderationAdapterInstance = new KeywordModerator();
    }
  }
  return moderationAdapterInstance;
}
