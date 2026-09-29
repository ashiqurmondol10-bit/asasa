import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import type { PaymentRecord, PaymentStatus } from '../types/payment';

export function getFinalAmount(p: PaymentRecord): number {
  if (p.editedAmount !== null && p.editedAmount !== undefined) {
    return Number(p.editedAmount) || 0;
  }
  return Number(p.originalAmount) || 0;
}

export function usePaymentStats() {
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  const counts: Record<PaymentStatus | 'ALL', number> = {
    ALL: payments.length,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    FAKE: 0,
  };

  const totals: Record<PaymentStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    FAKE: 0,
  };

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonthStr = now.toISOString().slice(0, 7);

  let todayApprovedAmount = 0;
  let currentMonthApprovedAmount = 0;

  payments.forEach(p => {
    const finalAmt = getFinalAmount(p);
    counts[p.status] = (counts[p.status] || 0) + 1;
    totals[p.status] = (totals[p.status] || 0) + finalAmt;

    const pDate = p.receivedAt ? p.receivedAt.slice(0, 10) : '';
    const pMonth = p.receivedAt ? p.receivedAt.slice(0, 7) : '';

    if (p.status === 'APPROVED') {
      if (pDate === todayStr) {
        todayApprovedAmount += finalAmt;
      }
      if (pMonth === currentMonthStr) {
        currentMonthApprovedAmount += finalAmt;
      }
    }
  });

  // Daily payments & volume for last 14 days
  const dailyMap = new Map<string, { date: string; label: string; count: number; approvedCount: number; approvedAmount: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap.set(key, { date: key, label, count: 0, approvedCount: 0, approvedAmount: 0 });
  }

  payments.forEach(p => {
    const pDate = p.receivedAt ? p.receivedAt.slice(0, 10) : '';
    if (dailyMap.has(pDate)) {
      const entry = dailyMap.get(pDate)!;
      entry.count += 1;
      if (p.status === 'APPROVED') {
        entry.approvedCount += 1;
        entry.approvedAmount += getFinalAmount(p);
      }
    }
  });

  const dailyTrend = Array.from(dailyMap.values());

  // Status distribution for chart
  const statusDistribution = [
    { name: 'Approved', value: counts.APPROVED, color: '#10b981' },
    { name: 'Pending', value: counts.PENDING, color: '#f59e0b' },
    { name: 'Rejected', value: counts.REJECTED, color: '#ef4444' },
    { name: 'Fake', value: counts.FAKE, color: '#8b5cf6' },
  ].filter(item => item.value > 0);

  return {
    payments,
    counts,
    totals,
    totalApprovedAmount: totals.APPROVED,
    todayApprovedAmount,
    currentMonthApprovedAmount,
    dailyTrend,
    statusDistribution,
  };
}
