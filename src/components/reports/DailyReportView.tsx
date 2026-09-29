import React, { useState, useMemo } from 'react';
import { Calendar, Download, CheckCircle2, XCircle, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import type { PaymentRecord, PaymentStatus } from '../../types/payment';
import { StatusBadge } from '../common/StatusBadge';
import { exportPaymentsToCSV } from '../../services/exportService';

interface DailyReportViewProps {
  payments: PaymentRecord[];
  onSelectPayment: (payment: PaymentRecord) => void;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({ payments, onSelectPayment }) => {
  // Default to today
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const dayPayments = useMemo(() => {
    return payments.filter((p) => {
      const pDate = p.receivedAt ? p.receivedAt.slice(0, 10) : '';
      return pDate === selectedDate;
    });
  }, [payments, selectedDate]);

  const stats = useMemo(() => {
    let total = dayPayments.length;
    let approved = 0;
    let rejected = 0;
    let fake = 0;
    let pending = 0;

    let approvedAmount = 0;
    let rejectedAmount = 0;
    let fakeAmount = 0;
    let pendingAmount = 0;

    dayPayments.forEach((p) => {
      const finalAmt = p.editedAmount !== null && p.editedAmount !== undefined ? p.editedAmount : p.originalAmount;
      switch (p.status) {
        case 'APPROVED':
          approved++;
          approvedAmount += finalAmt;
          break;
        case 'REJECTED':
          rejected++;
          rejectedAmount += finalAmt;
          break;
        case 'FAKE':
          fake++;
          fakeAmount += finalAmt;
          break;
        case 'PENDING':
        default:
          pending++;
          pendingAmount += finalAmt;
          break;
      }
    });

    return {
      total,
      approved,
      rejected,
      fake,
      pending,
      approvedAmount,
      rejectedAmount,
      fakeAmount,
      pendingAmount,
    };
  }, [dayPayments]);

  const handleExport = () => {
    exportPaymentsToCSV(dayPayments, `daily_report_${selectedDate}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Date Selector Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-400 border border-sky-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Daily Reconciliation & Audit</h3>
            <p className="text-xs text-slate-400">Strictly verified accounting by calendar date</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-400">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExport}
            disabled={dayPayments.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Day CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Approved Financial Total */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium uppercase tracking-wider mb-2">
            <span>Approved Accounting</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            ${stats.approvedAmount.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.approved} payment{stats.approved === 1 ? '' : 's'} verified
          </p>
        </div>

        {/* Pending Card */}
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium uppercase tracking-wider mb-2">
            <span>Pending Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">
            ${stats.pendingAmount.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.pending} payment{stats.pending === 1 ? '' : 's'} awaiting action
          </p>
        </div>

        {/* Rejected Card */}
        <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-rose-400 font-medium uppercase tracking-wider mb-2">
            <span>Rejected Total</span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">
            ${stats.rejectedAmount.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.rejected} rejected payment{stats.rejected === 1 ? '' : 's'}
          </p>
        </div>

        {/* Fake Card */}
        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-purple-400 font-medium uppercase tracking-wider mb-2">
            <span>Fake Flags</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-purple-400 font-mono">
            ${stats.fakeAmount.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.fake} flagged fraudulent attempt{stats.fake === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Day Payments Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl">
        <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Transactions for {selectedDate} ({dayPayments.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Official Accounting Rule: Only APPROVED amounts contribute to verified balance
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-4">Payment ID</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4 text-right">Original</th>
                <th className="py-2.5 px-4 text-right">Edited</th>
                <th className="py-2.5 px-4 text-right">Final Amount</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dayPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No payment screenshots recorded for this date.
                  </td>
                </tr>
              ) : (
                dayPayments.map((p) => {
                  const finalAmt = p.editedAmount !== null && p.editedAmount !== undefined ? p.editedAmount : p.originalAmount;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-sky-400">{p.id}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-slate-200">{p.telegramFirstName} {p.telegramLastName}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-1">(@{p.telegramUsername || p.telegramUserId})</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">${p.originalAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        {p.editedAmount !== null ? (
                          <span className="text-sky-400 font-medium">${p.editedAmount.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-white">${finalAmt.toFixed(2)}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={p.status} syncStatus={p.telegramSyncStatus} size="sm" />
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono">
                        {new Date(p.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => onSelectPayment(p)}
                          className="text-xs text-sky-400 hover:underline cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
