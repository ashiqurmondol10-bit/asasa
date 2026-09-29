import React, { useState, useMemo } from 'react';
import { CalendarRange, Download, CheckCircle2, XCircle, AlertTriangle, Clock, Users } from 'lucide-react';
import type { PaymentRecord } from '../../types/payment';
import { exportPaymentsToCSV } from '../../services/exportService';

interface FifteenDayReportViewProps {
  payments: PaymentRecord[];
  onSelectPayment: (payment: PaymentRecord) => void;
}

export const FifteenDayReportView: React.FC<FifteenDayReportViewProps> = ({
  payments,
  onSelectPayment,
}) => {
  // Set default range: 15 days ending today
  const today = new Date();
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(today.getDate() - 14);

  const [startDate, setStartDate] = useState(fifteenDaysAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const pDate = p.receivedAt ? p.receivedAt.slice(0, 10) : '';
      return pDate >= startDate && pDate <= endDate;
    });
  }, [payments, startDate, endDate]);

  const stats = useMemo(() => {
    let total = filteredPayments.length;
    let approved = 0;
    let rejected = 0;
    let fake = 0;
    let pending = 0;

    let approvedTotal = 0;
    let rejectedTotal = 0;
    let fakeTotal = 0;
    let pendingTotal = 0;

    filteredPayments.forEach((p) => {
      const finalAmt = p.editedAmount !== null && p.editedAmount !== undefined ? p.editedAmount : p.originalAmount;
      switch (p.status) {
        case 'APPROVED':
          approved++;
          approvedTotal += finalAmt;
          break;
        case 'REJECTED':
          rejected++;
          rejectedTotal += finalAmt;
          break;
        case 'FAKE':
          fake++;
          fakeTotal += finalAmt;
          break;
        case 'PENDING':
        default:
          pending++;
          pendingTotal += finalAmt;
          break;
      }
    });

    return {
      total,
      approved,
      rejected,
      fake,
      pending,
      approvedTotal,
      rejectedTotal,
      fakeTotal,
      pendingTotal,
    };
  }, [filteredPayments]);

  // User-wise 15-day totals
  const userWiseStats = useMemo(() => {
    const map = new Map<string, {
      userId: string;
      username: string;
      fullName: string;
      total: number;
      approved: number;
      rejected: number;
      fake: number;
      pending: number;
      approvedAmount: number;
    }>();

    filteredPayments.forEach((p) => {
      const finalAmt = p.editedAmount !== null && p.editedAmount !== undefined ? p.editedAmount : p.originalAmount;
      if (!map.has(p.telegramUserId)) {
        map.set(p.telegramUserId, {
          userId: p.telegramUserId,
          username: p.telegramUsername,
          fullName: `${p.telegramFirstName} ${p.telegramLastName}`.trim(),
          total: 0,
          approved: 0,
          rejected: 0,
          fake: 0,
          pending: 0,
          approvedAmount: 0,
        });
      }

      const u = map.get(p.telegramUserId)!;
      u.total++;
      if (p.status === 'APPROVED') {
        u.approved++;
        u.approvedAmount += finalAmt;
      } else if (p.status === 'REJECTED') {
        u.rejected++;
      } else if (p.status === 'FAKE') {
        u.fake++;
      } else {
        u.pending++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.approvedAmount - a.approvedAmount);
  }, [filteredPayments]);

  const handleExport = () => {
    exportPaymentsToCSV(filteredPayments, `15day_report_${startDate}_to_${endDate}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-400 border border-sky-500/20">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">15-Day Accounting Settlement</h3>
            <p className="text-xs text-slate-400">Two-week reconciliation window and user breakdown</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            />
            <span className="text-slate-500">→</span>
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExport}
            disabled={filteredPayments.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium uppercase tracking-wider mb-2">
            <span>Approved Total</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            ${stats.approvedTotal.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.approved} approved out of {stats.total} total
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium uppercase tracking-wider mb-2">
            <span>Pending Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">
            ${stats.pendingTotal.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{stats.pending} awaiting verification</p>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-rose-400 font-medium uppercase tracking-wider mb-2">
            <span>Rejected Total</span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">
            ${stats.rejectedTotal.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{stats.rejected} rejected screenshots</p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-purple-400 font-medium uppercase tracking-wider mb-2">
            <span>Fake Flags Total</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-purple-400 font-mono">
            ${stats.fakeTotal.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{stats.fake} flagged fraudulent</p>
        </div>
      </div>

      {/* User-Wise 15-Day Totals Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl">
        <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            User-Wise 15-Day Totals ({userWiseStats.length} users active)
          </h4>
          <span className="text-[11px] text-slate-400">
            Ranked by total approved financial volume
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Telegram ID</th>
                <th className="py-2.5 px-4 text-center">Total Received</th>
                <th className="py-2.5 px-4 text-center">Approved</th>
                <th className="py-2.5 px-4 text-center">Pending</th>
                <th className="py-2.5 px-4 text-center">Rejected / Fake</th>
                <th className="py-2.5 px-4 text-right">Approved Amount ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {userWiseStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No transactions recorded during this 15-day window.
                  </td>
                </tr>
              ) : (
                userWiseStats.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className="font-medium text-slate-200">{u.fullName || 'User'}</span>
                      {u.username && <span className="text-[10px] text-sky-400 font-mono ml-1.5">{u.username}</span>}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{u.userId}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-200">{u.total}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-emerald-400 font-semibold">{u.approved}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-amber-400">{u.pending}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-400">
                      <span className="text-rose-400">{u.rejected}</span> / <span className="text-purple-400">{u.fake}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      ${u.approvedAmount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
