import { db } from './dexie';
import type {
  PaymentRecord,
  PaymentStatus,
  UserRecord,
  TelegramSyncStatus,
  PublicUserLookupResult,
} from '../types/payment';

export const paymentService = {
  /**
   * Ingest a payment into IndexedDB with duplicate check and user record update.
   */
  async ingestPayment(payment: PaymentRecord): Promise<{ success: boolean; isDuplicate: boolean; record: PaymentRecord }> {
    // 1. Check duplicate by ID
    const existingById = await db.payments.get(payment.id);
    if (existingById) {
      return { success: true, isDuplicate: true, record: existingById };
    }

    // 2. Check duplicate by telegramChatId + telegramMessageId
    const existingByMessage = await db.payments
      .where('telegramChatId')
      .equals(payment.telegramChatId)
      .and(p => p.telegramMessageId === payment.telegramMessageId)
      .first();

    if (existingByMessage) {
      return { success: true, isDuplicate: true, record: existingByMessage };
    }

    // Ensure finalAmount is accurate
    const finalAmount = payment.editedAmount !== null && payment.editedAmount !== undefined
      ? payment.editedAmount
      : payment.originalAmount;

    const validatedRecord: PaymentRecord = {
      ...payment,
      paymentId: payment.id,
      finalAmount,
      updatedAt: payment.updatedAt || new Date().toISOString(),
    };

    await db.transaction('rw', db.payments, db.users, db.statusHistory, db.activityLogs, async () => {
      await db.payments.put(validatedRecord);

      // Record initial status history
      await db.statusHistory.add({
        paymentId: validatedRecord.id,
        oldStatus: validatedRecord.status,
        newStatus: validatedRecord.status,
        timestamp: validatedRecord.receivedAt,
        note: 'Initial payment received via Telegram',
      });

      // Record activity
      await db.activityLogs.add({
        paymentId: validatedRecord.id,
        action: 'Payment Received',
        details: `Received screenshot from @${validatedRecord.telegramUsername || validatedRecord.telegramUserId}. Original Amount: $${validatedRecord.originalAmount}`,
        timestamp: validatedRecord.receivedAt,
        adminUser: 'Telegram Webhook',
      });

      // Update user aggregate
      await this.updateUserAggregate(validatedRecord.telegramUserId, {
        username: validatedRecord.telegramUsername,
        firstName: validatedRecord.telegramFirstName,
        lastName: validatedRecord.telegramLastName,
      });
    });

    return { success: true, isDuplicate: false, record: validatedRecord };
  },

  /**
   * Update payment status and record audit log and history.
   */
  async updateStatus(
    paymentId: string,
    newStatus: PaymentStatus,
    adminNote?: string,
    adminUser = 'Admin'
  ): Promise<PaymentRecord> {
    const payment = await db.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const oldStatus = payment.status;
    const now = new Date().toISOString();

    const updatedPayment: PaymentRecord = {
      ...payment,
      status: newStatus,
      updatedAt: now,
      adminNote: adminNote !== undefined ? adminNote : payment.adminNote,
    };

    await db.transaction('rw', db.payments, db.users, db.statusHistory, db.activityLogs, async () => {
      await db.payments.put(updatedPayment);

      await db.statusHistory.add({
        paymentId,
        oldStatus,
        newStatus,
        timestamp: now,
        note: adminNote,
      });

      await db.activityLogs.add({
        paymentId,
        action: `Status Changed: ${oldStatus} → ${newStatus}`,
        details: `Status set to ${newStatus}. Final Amount: $${updatedPayment.finalAmount}${adminNote ? ` | Note: ${adminNote}` : ''}`,
        timestamp: now,
        adminUser,
      });

      await this.updateUserAggregate(payment.telegramUserId);
    });

    return updatedPayment;
  },

  /**
   * Edit payment amount while preserving the original amount.
   */
  async editAmount(
    paymentId: string,
    newAmount: number,
    adminNote?: string,
    adminUser = 'Admin'
  ): Promise<PaymentRecord> {
    const payment = await db.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const oldAmount = payment.finalAmount;
    const now = new Date().toISOString();

    const updatedPayment: PaymentRecord = {
      ...payment,
      editedAmount: newAmount,
      finalAmount: newAmount,
      usdAmount: newAmount, // 1:1 if USD
      updatedAt: now,
      adminNote: adminNote !== undefined ? adminNote : payment.adminNote,
    };

    await db.transaction('rw', db.payments, db.users, db.activityLogs, async () => {
      await db.payments.put(updatedPayment);

      await db.activityLogs.add({
        paymentId,
        action: 'Amount Edited',
        details: `Amount changed: $${oldAmount} → $${newAmount} (Original: $${payment.originalAmount})${adminNote ? ` | Note: ${adminNote}` : ''}`,
        timestamp: now,
        adminUser,
      });

      await this.updateUserAggregate(payment.telegramUserId);
    });

    return updatedPayment;
  },

  /**
   * Update internal admin note and internal report (never exposed to user).
   */
  async updateInternalNotes(
    paymentId: string,
    adminNote: string,
    internalReport: string,
    adminUser = 'Admin'
  ): Promise<PaymentRecord> {
    const payment = await db.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const now = new Date().toISOString();
    const updatedPayment: PaymentRecord = {
      ...payment,
      adminNote,
      internalReport,
      updatedAt: now,
    };

    await db.payments.put(updatedPayment);

    await db.activityLogs.add({
      paymentId,
      action: 'Notes Updated',
      details: 'Internal admin note / report modified',
      timestamp: now,
      adminUser,
    });

    return updatedPayment;
  },

  /**
   * Update Telegram sync status and message ID reference.
   */
  async updateTelegramSync(
    paymentId: string,
    syncStatus: TelegramSyncStatus,
    telegramStatusMessageId?: number | null,
    error?: string | null
  ): Promise<void> {
    const payment = await db.payments.get(paymentId);
    if (!payment) return;

    await db.payments.update(paymentId, {
      telegramSyncStatus: syncStatus,
      ...(telegramStatusMessageId !== undefined ? { telegramStatusMessageId } : {}),
      telegramSyncError: error || null,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Recompute user profile aggregate from payments.
   */
  async updateUserAggregate(
    telegramUserId: string,
    identityHints?: { username?: string; firstName?: string; lastName?: string }
  ): Promise<UserRecord> {
    const userPayments = await db.payments
      .where('telegramUserId')
      .equals(telegramUserId)
      .toArray();

    let totalPayments = userPayments.length;
    let approvedPayments = 0;
    let rejectedPayments = 0;
    let fakePayments = 0;
    let pendingPayments = 0;
    let totalApprovedAmount = 0;
    let firstDate = '';
    let lastDate = '';

    // Sort by received date
    const sorted = [...userPayments].sort(
      (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
    );

    if (sorted.length > 0) {
      firstDate = sorted[0].receivedAt;
      lastDate = sorted[sorted.length - 1].receivedAt;
    }

    let username = identityHints?.username || '';
    let firstName = identityHints?.firstName || '';
    let lastName = identityHints?.lastName || '';

    for (const p of userPayments) {
      if (!username && p.telegramUsername) username = p.telegramUsername;
      if (!firstName && p.telegramFirstName) firstName = p.telegramFirstName;
      if (!lastName && p.telegramLastName) lastName = p.telegramLastName;

      const finalAmt = p.editedAmount !== null && p.editedAmount !== undefined
        ? p.editedAmount
        : p.originalAmount;

      switch (p.status) {
        case 'APPROVED':
          approvedPayments++;
          totalApprovedAmount += finalAmt;
          break;
        case 'REJECTED':
          rejectedPayments++;
          break;
        case 'FAKE':
          fakePayments++;
          break;
        case 'PENDING':
        default:
          pendingPayments++;
          break;
      }
    }

    const userRecord: UserRecord = {
      telegramUserId,
      username: username || '',
      firstName: firstName || '',
      lastName: lastName || '',
      totalPayments,
      approvedPayments,
      rejectedPayments,
      fakePayments,
      pendingPayments,
      totalApprovedAmount,
      firstPaymentDate: firstDate || new Date().toISOString(),
      lastPaymentDate: lastDate || new Date().toISOString(),
    };

    await db.users.put(userRecord);
    return userRecord;
  },

  /**
   * Public customer lookup by Telegram User ID.
   * STRICT SECURITY: Only returns permitted non-sensitive fields.
   * Strips adminNote, internalReport, amount edit history, and other users' records.
   */
  async getPublicUserLookup(telegramUserId: string): Promise<PublicUserLookupResult | null> {
    const sanitizedId = telegramUserId.trim().replace(/^@/, '');
    if (!sanitizedId) return null;

    // Search by telegramUserId or username
    const userPayments = await db.payments
      .filter(p => p.telegramUserId === sanitizedId || p.telegramUsername.toLowerCase() === sanitizedId.toLowerCase())
      .toArray();

    if (userPayments.length === 0) {
      return null;
    }

    const sorted = [...userPayments].sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    const statuses: Record<PaymentStatus, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      FAKE: 0,
    };

    let approvedAmount = 0;

    const sanitizedList = sorted.map(p => {
      const amt = p.editedAmount !== null && p.editedAmount !== undefined
        ? p.editedAmount
        : p.originalAmount;

      statuses[p.status] = (statuses[p.status] || 0) + 1;
      if (p.status === 'APPROVED') {
        approvedAmount += amt;
      }

      return {
        paymentId: p.id,
        amount: amt,
        currency: p.currency || 'USD',
        status: p.status,
        date: p.receivedAt,
      };
    });

    const first = sorted[0];

    return {
      telegramUserId: first.telegramUserId,
      username: first.telegramUsername,
      firstName: first.telegramFirstName,
      paymentCount: sanitizedList.length,
      approvedAmount,
      currentStatuses: statuses,
      payments: sanitizedList,
    };
  },
};
