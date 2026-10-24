export interface SendNotificationOptions {
  userId: string;
  channel: 'email' | 'whatsapp_link';
  templateKey: string;
  reasonText: string;
  recipientEmail?: string;
  recipientPhone?: string;
  payload: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  id: string;
  channel: string;
  status: 'queued' | 'sent' | 'skipped';
  scheduledFor?: string;
  reasonText: string;
}

export interface NotifyAdapter {
  send(options: SendNotificationOptions): Promise<NotificationResult>;
  generateWhatsAppLink(phone: string, text: string, userConsentedToWhatsApp: boolean): string | null;
}
