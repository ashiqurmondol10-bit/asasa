import type { PaymentRecord, PaymentStatus } from '../types/payment';

export interface SyncResponse {
  ok: boolean;
  pending: PaymentRecord[];
  count: number;
}

export interface BotInfoResponse {
  ok: boolean;
  configured: boolean;
  bot?: {
    id: number;
    username: string;
    firstName: string;
  };
  webhookInfo?: {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    last_error_date?: number;
    last_error_message?: string;
  };
  error?: string;
}

export const apiClient = {
  /**
   * Fetch newly received Telegram webhook payments that need to be ingested into Dexie
   */
  async syncPendingPayments(): Promise<PaymentRecord[]> {
    const res = await fetch('/api/payments/sync');
    if (!res.ok) {
      throw new Error(`Sync failed with status: ${res.status}`);
    }
    const data: SyncResponse = await res.json();
    return data.pending || [];
  },

  /**
   * Acknowledge payments successfully written into IndexedDB
   */
  async acknowledgePayments(ackIds: string[]): Promise<void> {
    if (!ackIds.length) return;
    await fetch('/api/payments/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ackIds }),
    });
  },

  /**
   * Send or update Telegram public status message
   */
  async updateTelegramPublicStatus(params: {
    chatId: string | number;
    replyToMessageId: number;
    existingStatusMessageId?: number | null;
    status: PaymentStatus;
    finalAmount: number;
    currency: string;
    paymentId: string;
  }): Promise<{ ok: boolean; messageId?: number; warning?: string; error?: string }> {
    const res = await fetch('/api/telegram/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  /**
   * Returns secure image URL routed through server-side proxy
   */
  getTelegramImageProxyUrl(fileId: string): string {
    return `/api/telegram/image?fileId=${encodeURIComponent(fileId)}`;
  },

  /**
   * Check Telegram Bot connection status
   */
  async checkBotStatus(): Promise<BotInfoResponse> {
    const res = await fetch('/api/telegram/me');
    return res.json();
  },

  /**
   * Configure Telegram webhook URL
   */
  async setWebhook(webhookUrl: string, secretToken?: string): Promise<{ ok: boolean; description?: string }> {
    const res = await fetch('/api/telegram/set-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, secretToken }),
    });
    return res.json();
  },

  /**
   * Send simulated inbound Telegram payment for testing webhook pipeline
   */
  async simulateInboundPayment(data: {
    userId?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    caption?: string;
    amount?: number;
  }): Promise<{ ok: boolean; paymentId?: string; detectedAmount?: number }> {
    const res = await fetch('/api/telegram/test-inbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
