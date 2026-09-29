import React, { useState, useMemo } from 'react';
import { Users, Download, Search, Filter } from 'lucide-react';
import type { PaymentRecord } from '../../types/payment';
import { exportPaymentsToCSV } from '../../services/exportService';

interface UserWiseReportViewProps {
  payments: PaymentRecord[];
}

type TimeRangePreset = 'today' | '7days' | '15days' | 'month' | 'custom' | 'all';

export const UserWiseReportView: React.FC<UserWiseReportViewProps> = ({ payments }) => {
  const [preset, setPreset] = useState<TimeRangePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const pDate = p.receivedAt ? p.receivedAt.slice(0, 10) : '';

      if (preset === 'today') {
        return pDate === todayStr;
      }
      if (preset === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return pDate >= d.toISOString().slice(0, 10);
      }
      if (preset === '15days') {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return pDate >= d.toISOString().slice(0, 10);
      }
      if (preset === 'month') {
        return pDate.slice(0, 7) === todayStr.slice(0, 7);
      }
      if (preset === 'custom' && customStart && customEnd) {
        return pDate >= customStart && pDate <= customEnd;
      }
      return true; // 'all'
    });
  }, [payments, preset, customStart, customEnd, todayStr]);

  const userStats = useMemo(() => {
    const map = new Map<string, {
      userId: string;
      username: string;
      fullName: string;
      received: number;
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
          received: 0,
          approved: 0,
          rejected: 0,
          fake: 0,
          pending: 0,
          approvedAmount: 0,
        });
      }

      const u = map.get(p.telegramUserId)!;
      u.received++;
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

    let list = Array.from(map.values());

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((u) => {
        return (
          u.userId.toLowerCase().includes(term) ||
          u.username.toLowerCase().includes(term) ||
          u.fullName.toLowerCase().includes(term)
        );
      });
    }

    return list.sort((a, b) => b.approvedAmount - a.approvedAmount);
  }, [filteredPayments, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Time Range Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setPreset('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              preset === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setPreset('today')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              preset === 'today' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPreset('7days')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              preset === '7days' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPreset('15days')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              preset === '15days' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            15 Days
          </button>
          <button
            onClick={() => setPreset('month')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              preset === 'month' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setPreset('custom')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              preset === 'custom' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom Range
          </button>
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            />
            <span className="text-slate-500">→</span>
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            />
          </div>
        )}

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* User Breakdown Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl">
        <div className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            User-Wise Accounting Summary ({userStats.length} users)
          </h4>
          <span className="text-[11px] text-slate-400">
            Calculated strictly from verified payment records
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
                <th className="py-2.5 px-4 text-center">Rejected</th>
                <th className="py-2.5 px-4 text-center">Fake</th>
                <th className="py-2.5 px-4 text-right">Total Approved Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {userStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No payment records match this time range.
                  </td>
                </tr>
              ) : (
                userStats.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4">
                      <span className="font-medium text-slate-200">{u.fullName || 'User'}</span>
                      {u.username && <span className="text-[10px] text-sky-400 font-mono ml-1.5">{u.username}</span>}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{u.userId}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-200">{u.received}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-emerald-400 font-semibold">{u.approved}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-amber-400">{u.pending}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-rose-400">{u.rejected}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-purple-400">{u.fake}</td>
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
