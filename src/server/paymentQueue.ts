import fs from 'fs';
import path from 'path';
import type { PaymentRecord } from '../types/payment';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const QUEUE_FILE = path.join(DATA_DIR, 'pending_payments.json');
const PROCESSED_KEYS_FILE = path.join(DATA_DIR, 'processed_messages.json');

// In-memory fallback
let inMemoryQueue: PaymentRecord[] = [];
let processedKeysSet = new Set<string>();

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Serverless read-only filesystem fallback
  }
}

function loadQueue(): PaymentRecord[] {
  try {
    ensureDataDir();
    if (fs.existsSync(QUEUE_FILE)) {
      const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
      inMemoryQueue = JSON.parse(data);
    }
  } catch {
    // Keep in-memory queue
  }
  return inMemoryQueue;
}

function saveQueue(queue: PaymentRecord[]) {
  inMemoryQueue = queue;
  try {
    ensureDataDir();
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
  } catch {
    // In-memory fallback
  }
}

function loadProcessedKeys(): Set<string> {
  try {
    ensureDataDir();
    if (fs.existsSync(PROCESSED_KEYS_FILE)) {
      const data = fs.readFileSync(PROCESSED_KEYS_FILE, 'utf-8');
      const arr = JSON.parse(data);
      processedKeysSet = new Set(arr);
    }
  } catch {
    // Keep in-memory
  }
  return processedKeysSet;
}

function markProcessed(key: string) {
  loadProcessedKeys();
  processedKeysSet.add(key);
  try {
    ensureDataDir();
    fs.writeFileSync(PROCESSED_KEYS_FILE, JSON.stringify(Array.from(processedKeysSet)), 'utf-8');
  } catch {
    // Ignore in serverless
  }
}

export const paymentQueue = {
  /**
   * Check if Telegram message has already been processed to prevent duplicates
   */
  isDuplicate(chatId: string | number, messageId: number, updateId?: number): boolean {
    loadProcessedKeys();
    const msgKey = `${chatId}:${messageId}`;
    if (processedKeysSet.has(msgKey)) return true;
    if (updateId && processedKeysSet.has(`update:${updateId}`)) return true;

    // Also check current pending queue
    const queue = loadQueue();
    const foundInQueue = queue.some(
      p => String(p.telegramChatId) === String(chatId) && p.telegramMessageId === messageId
    );
    return foundInQueue;
  },

  /**
   * Add newly received Telegram payment to pending queue
   */
  enqueue(payment: PaymentRecord, updateId?: number): void {
    const queue = loadQueue();
    const msgKey = `${payment.telegramChatId}:${payment.telegramMessageId}`;
    markProcessed(msgKey);
    if (updateId) markProcessed(`update:${updateId}`);

    // Prepend new payment
    queue.unshift(payment);
    saveQueue(queue);
  },

  /**
   * Get all pending payments for admin ingest
   */
  getPending(): PaymentRecord[] {
    return loadQueue();
  },

  /**
   * Acknowledge payments that have been safely persisted in IndexedDB
   */
  acknowledge(ids: string[]): void {
    const idSet = new Set(ids);
    const queue = loadQueue();
    const remaining = queue.filter(p => !idSet.has(p.id));
    saveQueue(remaining);
  },

  /**
   * Clear all pending (for admin reset/testing)
   */
  clear(): void {
    saveQueue([]);
  },
};
