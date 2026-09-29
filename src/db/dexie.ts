import Dexie, { type Table } from 'dexie';
import type {
  PaymentRecord,
  UserRecord,
  StatusHistoryRecord,
  ActivityLogRecord,
  SettingRecord,
} from '../types/payment';

export class TelePayDatabase extends Dexie {
  payments!: Table<PaymentRecord, string>;
  users!: Table<UserRecord, string>;
  statusHistory!: Table<StatusHistoryRecord, number>;
  activityLogs!: Table<ActivityLogRecord, number>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super('PaymentDatabase');

    this.version(1).stores({
      payments: 'id, telegramUserId, telegramChatId, telegramMessageId, telegramFileId, status, receivedAt, updatedAt, finalAmount',
      users: 'telegramUserId, username, firstName, lastName, totalPayments, approvedPayments, rejectedPayments, fakePayments, pendingPayments, totalApprovedAmount, firstPaymentDate, lastPaymentDate',
      statusHistory: '++id, paymentId, oldStatus, newStatus, timestamp',
      activityLogs: '++id, paymentId, action, timestamp, adminUser',
      settings: 'key',
    });
  }
}

export const db = new TelePayDatabase();
