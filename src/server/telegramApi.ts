import type {
  TelegramGetFileResponse,
  TelegramSendMessageResponse,
} from '../types/telegram';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured in environment variables');
  }
  return token.trim();
}

export function hasBotToken(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim().length > 10);
}

export const telegramApi = {
  /**
   * Test bot token and return bot user info
   */
  async getMe(): Promise<{ ok: boolean; bot?: { id: number; username: string; firstName: string }; error?: string }> {
    try {
      const token = getBotToken();
      const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getMe`);
      const data = await res.json();
      if (!data.ok) {
        return { ok: false, error: data.description || 'Failed to authenticate with Telegram' };
      }
      return {
        ok: true,
        bot: {
          id: data.result.id,
          username: data.result.username,
          firstName: data.result.first_name,
        },
      };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  /**
   * Set Telegram Webhook URL
   */
  async setWebhook(url: string, secretToken?: string): Promise<{ ok: boolean; description?: string }> {
    const token = getBotToken();
    const payload: Record<string, unknown> = {
      url,
      allowed_updates: ['message', 'edited_message'],
    };
    if (secretToken) {
      payload.secret_token = secretToken;
    }

    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  /**
   * Get current Telegram Webhook info
   */
  async getWebhookInfo(): Promise<Record<string, unknown>> {
    const token = getBotToken();
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getWebhookInfo`);
    return res.json();
  },

  /**
   * Retrieve file path for a file_id
   */
  async getFilePath(fileId: string): Promise<string> {
    const token = getBotToken();
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const data: TelegramGetFileResponse = await res.json();
    if (!data.ok || !data.result?.file_path) {
      throw new Error(data.description || `Could not find Telegram file for ID: ${fileId}`);
    }
    return data.result.file_path;
  },

  /**
   * Send a general text message to a chat
   */
  async sendMessage(chatId: string | number, text: string, replyToMessageId?: number): Promise<TelegramSendMessageResponse> {
    const token = getBotToken();
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }

    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  /**
   * Fetch image bytes stream from Telegram
   */
  async fetchFileStream(filePath: string): Promise<Response> {
    const token = getBotToken();
    const fileUrl = `${TELEGRAM_API_BASE}/file/bot${token}/${filePath}`;
    const res = await fetch(fileUrl);
    if (!res.ok) {
      throw new Error(`Failed to download file from Telegram: ${res.statusText}`);
    }
    return res;
  },

  /**
   * Send or edit public status message to Telegram user
   * STRICT SECURITY: Only sends public approved/rejected/fake text.
   * Internal notes, reports, and edit history are NEVER exposed.
   */
  async updatePublicStatusMessage(params: {
    chatId: string | number;
    replyToMessageId: number;
    existingStatusMessageId?: number | null;
    status: 'APPROVED' | 'REJECTED' | 'FAKE' | 'PENDING';
    finalAmount: number;
    currency: string;
    paymentId: string;
  }): Promise<{ ok: boolean; messageId?: number; error?: string }> {
    const { chatId, replyToMessageId, existingStatusMessageId, status, finalAmount, currency, paymentId } = params;

    let publicText = '';
    const formattedAmount = `${currency === 'USD' ? '$' : `${currency} `}${finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (status === 'APPROVED') {
      publicText = `✅ <b>PAYMENT APPROVED</b>\n\n` +
        `<b>Amount:</b> ${formattedAmount}\n` +
        `<b>Payment ID:</b> <code>${paymentId}</code>\n\n` +
        `<i>Your payment has been successfully verified and confirmed.</i>`;
    } else if (status === 'REJECTED') {
      publicText = `❌ <b>PAYMENT REJECTED</b>\n\n` +
        `<b>Payment ID:</b> <code>${paymentId}</code>\n\n` +
        `<i>Your payment verification was rejected. Please review your screenshot or contact support.</i>`;
    } else if (status === 'FAKE') {
      publicText = `🚫 <b>FAKE SCREENSHOT</b>\n\n` +
        `<b>Payment ID:</b> <code>${paymentId}</code>\n\n` +
        `<i>The submitted screenshot could not be verified or appears invalid/altered.</i>`;
    } else {
      publicText = `⏳ <b>PAYMENT PENDING</b>\n\n` +
        `<b>Payment ID:</b> <code>${paymentId}</code>\n\n` +
        `<i>Your payment is currently under review by our team.</i>`;
    }

    const token = getBotToken();

    // 1. Try editing existing status message if one was sent previously
    if (existingStatusMessageId) {
      try {
        const editRes = await fetch(`${TELEGRAM_API_BASE}/bot${token}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: existingStatusMessageId,
            text: publicText,
            parse_mode: 'HTML',
          }),
        });
        const editData: TelegramSendMessageResponse = await editRes.json();
        if (editData.ok && editData.result?.message_id) {
          return { ok: true, messageId: editData.result.message_id };
        }
      } catch (err) {
        // Fallback to sending a new message if editing fails (e.g. message too old or deleted)
        console.warn('Telegram editMessageText failed, falling back to sendMessage', err);
      }
    }

    // 2. Send new status message with reply_to_message_id
    try {
      const sendRes = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: publicText,
          reply_to_message_id: replyToMessageId,
          parse_mode: 'HTML',
        }),
      });
      const sendData: TelegramSendMessageResponse = await sendRes.json();
      if (!sendData.ok) {
        return { ok: false, error: sendData.description || 'Telegram sendMessage failed' };
      }
      return { ok: true, messageId: sendData.result?.message_id };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
