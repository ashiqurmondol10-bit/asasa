export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAKE';

export type TelegramSyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface PaymentRecord {
  id: string; // PAY-YYYYMMDD-XXXXXX
  paymentId: string; // alias to id for consistency
  telegramUserId: string;
  telegramChatId: string | number;
  telegramUsername: string;
  telegramFirstName: string;
  telegramLastName: string;
  telegramMessageId: number;
  telegramFileId: string;
  originalAmount: number;
  editedAmount: number | null;
  finalAmount: number; // editedAmount ?? originalAmount
  currency: string;
  usdAmount: number;
  caption: string;
  status: PaymentStatus;
  telegramStatusMessageId: number | null;
  telegramSyncStatus: TelegramSyncStatus;
  telegramSyncError?: string | null;
  receivedAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  adminNote: string;
  internalReport: string;
  detectedAmount?: number | null;
  telegramUpdateId?: number;
}

export interface UserRecord {
  telegramUserId: string;
  username: string;
  firstName: string;
  lastName: string;
  totalPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  fakePayments: number;
  pendingPayments: number;
  totalApprovedAmount: number;
  firstPaymentDate: string;
  lastPaymentDate: string;
}

export interface StatusHistoryRecord {
  id?: number;
  paymentId: string;
  oldStatus: PaymentStatus;
  newStatus: PaymentStatus;
  timestamp: string;
  note?: string;
}

export interface ActivityLogRecord {
  id?: number;
  paymentId?: string;
  action: string;
  details: string;
  timestamp: string;
  adminUser: string;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface PublicUserPaymentLookup {
  paymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  date: string;
}

export interface PublicUserLookupResult {
  telegramUserId: string;
  username?: string;
  firstName?: string;
  paymentCount: number;
  approvedAmount: number;
  currentStatuses: Record<PaymentStatus, number>;
  payments: PublicUserPaymentLookup[];
}

export interface AmountEditPayload {
  paymentId: string;
  newAmount: number;
  note?: string;
}

export interface StatusUpdatePayload {
  paymentId: string;
  status: PaymentStatus;
  note?: string;
}
