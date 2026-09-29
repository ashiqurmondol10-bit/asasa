import type { Request, Response } from 'express';
import { parseCaptionAmount, generatePaymentId } from './amountParser';
import { paymentQueue } from './paymentQueue';
import { telegramApi, hasBotToken } from './telegramApi';
import type { TelegramUpdate, TelegramPhotoSize } from '../types/telegram';
import type { PaymentRecord } from '../types/payment';

export const handlers = {
  /**
   * Telegram Webhook Handler (POST /api/telegram/webhook)
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const update = req.body as TelegramUpdate;

      if (!update) {
        return res.status(400).json({ ok: false, error: 'Empty update payload' });
      }

      // Handle optional Telegram webhook secret token validation
      const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
      if (process.env.TELEGRAM_WEBHOOK_SECRET && secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return res.status(403).json({ ok: false, error: 'Invalid secret token' });
      }

      const message = update.message || update.edited_message;
      if (!message) {
        // Return 200 for other update types (e.g. callback queries, bot member changes)
        return res.status(200).json({ ok: true, ignored: 'No message in update' });
      }

      // Check if message has a photo or document image
      let fileId = '';
      if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
        // Largest photo is the last element
        const largestPhoto = message.photo[message.photo.length - 1] as TelegramPhotoSize;
        fileId = largestPhoto.file_id;
      } else if (message.document && message.document.mime_type?.startsWith('image/')) {
        fileId = message.document.file_id;
      }

      // If user sent a text message without screenshot, we can optionally reply with instructions
      if (!fileId) {
        if (message.text && hasBotToken()) {
          try {
            await telegramApi.sendMessage(
              message.chat.id,
              '👋 <b>Welcome to Payment Verification!</b>\n\nPlease send your payment screenshot / receipt image as a photo or image file to verify your payment.',
              message.message_id
            );
          } catch {
            // Ignore response error
          }
        }
        return res.status(200).json({ ok: true, message: 'Non-photo message acknowledged' });
      }

      const chatId = message.chat.id;
      const messageId = message.message_id;
      const updateId = update.update_id;

      // Duplicate prevention
      if (paymentQueue.isDuplicate(chatId, messageId, updateId)) {
        return res.status(200).json({ ok: true, duplicate: true, message: 'Message already processed' });
      }

      const sender = message.from || message.chat;
      const caption = message.caption || '';
      const parsed = parseCaptionAmount(caption);

      const paymentId = generatePaymentId();
      const receivedDate = message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString();

      const newPayment: PaymentRecord = {
        id: paymentId,
        paymentId,
        telegramUserId: String(sender.id || chatId),
        telegramChatId: chatId,
        telegramUsername: sender.username ? `@${sender.username.replace(/^@/, '')}` : '',
        telegramFirstName: sender.first_name || '',
        telegramLastName: sender.last_name || '',
        telegramMessageId: messageId,
        telegramFileId: fileId,
        originalAmount: parsed.amount,
        editedAmount: null,
        finalAmount: parsed.amount,
        currency: parsed.currency || 'USD',
        usdAmount: parsed.amount,
        caption,
        status: 'PENDING',
        telegramStatusMessageId: null,
        telegramSyncStatus: 'SYNCED',
        telegramSyncError: null,
        receivedAt: receivedDate,
        updatedAt: receivedDate,
        adminNote: '',
        internalReport: '',
        detectedAmount: parsed.detected ? parsed.amount : null,
        telegramUpdateId: updateId,
      };

      paymentQueue.enqueue(newPayment, updateId);

      // Send auto-acknowledgement reply to the Telegram user that screenshot was received
      if (hasBotToken()) {
        try {
          const formattedAmt = parsed.detected
            ? `\n<b>Detected Amount:</b> ${parsed.currency === 'USD' ? '$' : `${parsed.currency} `}${parsed.amount.toFixed(2)}`
            : '';
          const receiptText =
            `📥 <b>Payment Screenshot Received!</b>\n\n` +
            `<b>Payment ID:</b> <code>${paymentId}</code>${formattedAmt}\n` +
            `<b>Status:</b> ⏳ Under Review\n\n` +
            `<i>Our finance team has received your screenshot and will verify it shortly. You will receive an update here once processed.</i>`;

          const replyRes = await telegramApi.updatePublicStatusMessage({
            chatId,
            replyToMessageId: messageId,
            status: 'PENDING',
            finalAmount: parsed.amount,
            currency: parsed.currency || 'USD',
            paymentId,
          });

          if (replyRes.ok && replyRes.messageId) {
            newPayment.telegramStatusMessageId = replyRes.messageId;
          }
        } catch (botErr) {
          console.warn('Could not send initial receipt message to user', botErr);
        }
      }

      return res.status(200).json({
        ok: true,
        paymentId,
        detectedAmount: parsed.amount,
        currency: parsed.currency,
      });
    } catch (err: unknown) {
      console.error('Webhook error:', err);
      return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  /**
   * Secure Image Proxy (GET /api/telegram/image)
   * Client calls /api/telegram/image?fileId=... or /api/telegram/image/:paymentId
   * NEVER exposes TELEGRAM_BOT_TOKEN to the client!
   */
  async handleImageProxy(req: Request, res: Response) {
    try {
      const fileId = (req.query.fileId as string) || (req.params.fileId as string);

      if (!fileId) {
        return res.status(400).send('Missing fileId');
      }

      // Handle simulated/test file IDs gracefully
      if (fileId.startsWith('sim_') || fileId.startsWith('test_')) {
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none">
            <rect width="600" height="800" fill="#0f172a" />
            <rect x="20" y="20" width="560" height="760" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <circle cx="300" cy="180" r="48" fill="#059669" fill-opacity="0.15" stroke="#10b981" stroke-width="2"/>
            <path d="M285 180L295 190L315 170" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <text x="300" y="260" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="bold">TRANSACTION RECEIPT</text>
            <text x="300" y="290" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Simulated Screenshot Data</text>
            <line x1="60" y1="330" x2="540" y2="330" stroke="#334155" stroke-width="1" stroke-dasharray="6 6"/>
            <text x="60" y="380" fill="#94a3b8" font-family="sans-serif" font-size="14">File ID:</text>
            <text x="540" y="380" text-anchor="end" fill="#38bdf8" font-family="monospace" font-size="13">${fileId}</text>
            <text x="60" y="430" fill="#94a3b8" font-family="sans-serif" font-size="14">Provider:</text>
            <text x="540" y="430" text-anchor="end" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="600">Telegram Bot API</text>
            <text x="60" y="480" fill="#94a3b8" font-family="sans-serif" font-size="14">Status:</text>
            <text x="540" y="480" text-anchor="end" fill="#10b981" font-family="sans-serif" font-size="14" font-weight="600">Received Verified</text>
            <rect x="60" y="550" width="480" height="150" rx="12" fill="#090d16" stroke="#1e293b"/>
            <text x="80" y="590" fill="#64748b" font-family="sans-serif" font-size="12">NOTE FOR SYSTEM ADMINISTRATOR:</text>
            <text x="80" y="620" fill="#cbd5e1" font-family="sans-serif" font-size="13">When TELEGRAM_BOT_TOKEN is set in Vercel,</text>
            <text x="80" y="645" fill="#cbd5e1" font-family="sans-serif" font-size="13">actual Telegram photos stream directly from Telegram</text>
            <text x="80" y="670" fill="#cbd5e1" font-family="sans-serif" font-size="13">without saving or downloading to any VPS/S3 storage.</text>
          </svg>
        `.trim();
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(svg);
      }

      if (!hasBotToken()) {
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
            <rect width="600" height="400" fill="#0f172a" />
            <text x="300" y="180" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="18" font-weight="bold">TELEGRAM_BOT_TOKEN REQUIRED</text>
            <text x="300" y="215" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Please configure TELEGRAM_BOT_TOKEN in Vercel Environment Variables</text>
            <text x="300" y="245" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="12">File ID: ${fileId}</text>
          </svg>
        `.trim();
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.send(svg);
      }

      const filePath = await telegramApi.getFilePath(fileId);
      const telegramRes = await telegramApi.fetchFileStream(filePath);

      const contentType = telegramRes.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'private, max-age=86400');

      const arrayBuffer = await telegramRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return res.send(buffer);
    } catch (err: unknown) {
      console.error('Image proxy error:', err);
      res.setHeader('Content-Type', 'image/svg+xml');
      const errSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
          <rect width="600" height="400" fill="#0f172a" />
          <text x="300" y="180" text-anchor="middle" fill="#ef4444" font-family="sans-serif" font-size="18" font-weight="bold">Could Not Load Screenshot</text>
          <text x="300" y="215" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="13">${err instanceof Error ? err.message : String(err)}</text>
        </svg>
      `.trim();
      return res.send(errSvg);
    }
  },

  /**
   * Update Telegram Public Status (POST /api/telegram/status)
   */
  async handleStatusUpdate(req: Request, res: Response) {
    try {
      const { chatId, replyToMessageId, existingStatusMessageId, status, finalAmount, currency, paymentId } = req.body;

      if (!chatId || !replyToMessageId || !status || !paymentId) {
        return res.status(400).json({ ok: false, error: 'Missing required parameters' });
      }

      if (!hasBotToken()) {
        return res.status(200).json({
          ok: false,
          warning: 'TELEGRAM_BOT_TOKEN not configured yet. Status recorded locally.',
        });
      }

      const result = await telegramApi.updatePublicStatusMessage({
        chatId,
        replyToMessageId,
        existingStatusMessageId,
        status,
        finalAmount: Number(finalAmount) || 0,
        currency: currency || 'USD',
        paymentId,
      });

      return res.status(200).json(result);
    } catch (err: unknown) {
      console.error('Status update error:', err);
      return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  /**
   * Sync Pending Payments (GET /api/payments/sync)
   */
  async handleGetPending(req: Request, res: Response) {
    try {
      const pending = paymentQueue.getPending();
      return res.status(200).json({ ok: true, pending, count: pending.length });
    } catch (err: unknown) {
      return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  /**
   * Acknowledge Pending Payments (POST /api/payments/sync)
   */
  async handleAcknowledge(req: Request, res: Response) {
    try {
      const { ackIds } = req.body;
      if (Array.isArray(ackIds) && ackIds.length > 0) {
        paymentQueue.acknowledge(ackIds);
      }
      return res.status(200).json({ ok: true, remaining: paymentQueue.getPending().length });
    } catch (err: unknown) {
      return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  /**
   * Test Bot Connection (GET /api/telegram/me)
   */
  async handleGetMe(req: Request, res: Response) {
    try {
      const configured = hasBotToken();
      if (!configured) {
        return res.status(200).json({
          ok: true,
          configured: false,
          message: 'TELEGRAM_BOT_TOKEN is not set in environment variables',
        });
      }
      const botInfo = await telegramApi.getMe();
      const webhookInfo = await telegramApi.getWebhookInfo().catch(() => null);
      return res.status(200).json({
        ok: true,
        configured: true,
        bot: botInfo.bot,
        webhookInfo,
        error: botInfo.error,
      });
    } catch (err: unknown) {
      return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  /**
   * Set Webhook URL (POST /api/telegram/set-webhook)
   */
  async handleSetWebhook(req: Request, res: Response) {
    try {
      const { webhookUrl, secretToken } = req.body;
      if (!webhookUrl) {
        return res.status(400).json({ ok: false, error: 'webhookUrl is required' });
      }

      if (!hasBotToken()) {
        return res.status(400).json({
          ok: false,
          error: 'TELEGRAM_BOT_TOKEN must be configured before setting webhook',
        });
      }

      const result = await telegramApi.setWebhook(webhookUrl, secretToken);
      return res.status(200).json(result);
    } catch (err: unknown) {
      return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  /**
   * Test Inbound Webhook (POST /api/telegram/test-inbound)
   * Allows Admin to send a simulated Telegram webhook to test pipeline
   */
  async handleTestInbound(req: Request, res: Response) {
    try {
      const {
        userId = '987654321',
        username = 'tester_user',
        firstName = 'Alex',
        lastName = 'Morgan',
        caption = 'Payment $125.00 for order #8841',
        amount = 125,
      } = req.body;

      const randomMsgId = Math.floor(1000 + Math.random() * 90000);
      const testFileId = `sim_photo_${Date.now()}`;

      const syntheticUpdate: TelegramUpdate = {
        update_id: Math.floor(100000 + Math.random() * 900000),
        message: {
          message_id: randomMsgId,
          from: {
            id: Number(userId) || 987654321,
            is_bot: false,
            first_name: firstName,
            last_name: lastName,
            username: username,
          },
          chat: {
            id: Number(userId) || 987654321,
            first_name: firstName,
            last_name: lastName,
            username: username,
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
          photo: [
            {
              file_id: testFileId,
              file_unique_id: `uniq_${Date.now()}`,
              width: 1080,
              height: 1920,
              file_size: 154200,
            },
          ],
          caption: caption || `Payment $${amount}`,
        },
      };

      // Reuse webhook logic
      req.body = syntheticUpdate;
      return handlers.handleWebhook(req, res);
    } catch (err: unknown) {
      return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  },
};
