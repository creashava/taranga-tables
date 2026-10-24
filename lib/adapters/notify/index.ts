import { NotifyAdapter } from './types';
import { ConsoleNotifyAdapter } from './console';

export * from './types';
export * from './console';

let notifyAdapterInstance: NotifyAdapter | null = null;

export function getNotifyAdapter(): NotifyAdapter {
  if (!notifyAdapterInstance) {
    const provider = process.env.NOTIFY_PROVIDER || 'console';
    if (provider === 'console') {
      notifyAdapterInstance = new ConsoleNotifyAdapter();
    } else {
      console.warn(`[NOTIFY] Provider "${provider}" not implemented; defaulting to ConsoleNotifyAdapter.`);
      notifyAdapterInstance = new ConsoleNotifyAdapter();
    }
  }
  return notifyAdapterInstance;
}
