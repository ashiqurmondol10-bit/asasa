import type { PaymentRecord } from '../types/payment';

export function exportPaymentsToCSV(payments: PaymentRecord[], filename = 'payments_export.csv'): void {
  const headers = [
    'Payment ID',
    'Telegram User ID',
    'Username',
    'First Name',
    'Last Name',
    'Telegram Chat ID',
    'Telegram Message ID',
    'Telegram File ID',
    'Status',
    'Currency',
    'Original Amount',
    'Edited Amount',
    'Final Amount',
    'Received At',
    'Updated At',
    'Caption',
    'Admin Note',
    'Internal Report',
  ];

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = payments.map(p => {
    const finalAmt = p.editedAmount !== null && p.editedAmount !== undefined ? p.editedAmount : p.originalAmount;
    return [
      escapeCSV(p.id),
      escapeCSV(p.telegramUserId),
      escapeCSV(p.telegramUsername),
      escapeCSV(p.telegramFirstName),
      escapeCSV(p.telegramLastName),
      escapeCSV(p.telegramChatId),
      escapeCSV(p.telegramMessageId),
      escapeCSV(p.telegramFileId),
      escapeCSV(p.status),
      escapeCSV(p.currency || 'USD'),
      escapeCSV(p.originalAmount),
      escapeCSV(p.editedAmount !== null ? p.editedAmount : ''),
      escapeCSV(finalAmt),
      escapeCSV(p.receivedAt),
      escapeCSV(p.updatedAt),
      escapeCSV(p.caption),
      escapeCSV(p.adminNote),
      escapeCSV(p.internalReport),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
