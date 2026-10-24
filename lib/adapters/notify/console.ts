import { NotifyAdapter, SendNotificationOptions, NotificationResult } from './types';

export class ConsoleNotifyAdapter implements NotifyAdapter {
  private dailyNotificationCount: Map<string, { date: string; count: number }> = new Map();

  async send(options: SendNotificationOptions): Promise<NotificationResult> {
    const today = new Date().toISOString().slice(0, 10);
    const userHistory = this.dailyNotificationCount.get(options.userId);

    // Enforce R9 / AT9: At most one notification per day per user, with non-empty reason_text
    if (!options.reasonText || options.reasonText.trim().length === 0) {
      throw new Error(`Notification rejected: reason_text is required by Design Rule R9 / AT9.`);
    }

    if (userHistory && userHistory.date === today && userHistory.count >= 1) {
      console.warn(`[NOTIFY SUPPRESSED] User ${options.userId} already received 1 notification today (Rule R9 / AT9).`);
      return {
        success: false,
        id: `suppressed_${Date.now()}`,
        channel: options.channel,
        status: 'skipped',
        reasonText: options.reasonText,
      };
    }

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.dailyNotificationCount.set(options.userId, { date: today, count: (userHistory?.count || 0) + 1 });

    console.log(`[MOCK NOTIFY][${options.channel.toUpperCase()}] User: ${options.userId}`);
    console.log(`  Template: ${options.templateKey}`);
    console.log(`  Reason: "${options.reasonText}"`);
    console.log(`  Payload:`, JSON.stringify(options.payload));

    return {
      success: true,
      id,
      channel: options.channel,
      status: 'sent',
      scheduledFor: new Date().toISOString(),
      reasonText: options.reasonText,
    };
  }

  // AT2: withdrawing whatsapp_contact removes that member from wa.me link generation
  generateWhatsAppLink(phone: string, text: string, userConsentedToWhatsApp: boolean): string | null {
    if (!userConsentedToWhatsApp) {
      console.log(`[WHATSAPP LINK] Blocked: member has withdrawn or not granted whatsapp_contact consent (AT2).`);
      return null;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
}
