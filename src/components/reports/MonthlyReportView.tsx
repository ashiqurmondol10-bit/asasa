import React, { useState, useMemo } from 'react';
import { BarChart3, Download, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import type { PaymentRecord } from '../../types/payment';
import { exportPaymentsToCSV } from '../../services/exportService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface MonthlyReportViewProps {
  payments: PaymentRecord[];
  onSelectPayment: (payment: PaymentRecord) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({ payments }) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-09"
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const monthPayments = useMemo(() => {
    return payments.filter((p) => {
      const pMonth = p.receivedAt ? p.receivedAt.slice(0, 7) : '';
      return pMonth === selectedMonth;
    });
  }, [payments, selectedMonth]);

  const stats = useMemo(() => {
    let total = monthPayments.length;
    let approved = 0;
    let rejected = 0;
    let fake = 0;
    let pending = 0;

    let approvedTotal = 0;
    let rejectedTotal = 0;
    let fakeTotal = 0;
    let pendingTotal = 0;

    monthPayments.forEach((p) => {
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
  }, [monthPayments]);

  // Daily chart data for this month
  const chartData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const daysMap = new Map<string, { day: string; approvedAmount: number; totalCount: number; approvedCount: number }>();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayKey = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      daysMap.set(dayKey, { day: `${d}`, approvedAmount: 0, totalCount: 0, approvedCount: 0 });
    }

    monthPayments.forEach((p) => {
      const dateKey = p.receivedAt ? p.receivedAt.slice(0, 10) : '';
      if (daysMap.has(dateKey)) {
        const item = daysMap.get(dateKey)!;
        item.totalCount++;
        if (p.status === 'APPROVED') {
          const finalAmt = p.editedAmount !== null && p.editedAmount !== undefined ? p.editedAmount : p.originalAmount;
          item.approvedAmount += finalAmt;
          item.approvedCount++;
        }
      }
    });

    return Array.from(daysMap.values());
  }, [monthPayments, selectedMonth]);

  const handleExport = () => {
    exportPaymentsToCSV(monthPayments, `monthly_report_${selectedMonth}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Month Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-400 border border-sky-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Monthly Financial Report</h3>
            <p className="text-xs text-slate-400">Revenues, volume patterns, and reconciliation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExport}
            disabled={monthPayments.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Month CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Financial Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium uppercase tracking-wider mb-2">
            <span>Approved Total USD</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            ${stats.approvedTotal.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{stats.approved} approved transactions</p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium uppercase tracking-wider mb-2">
            <span>Pending Review USD</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">
            ${stats.pendingTotal.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{stats.pending} pending verification</p>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-rose-400 font-medium uppercase tracking-wider mb-2">
            <span>Rejected Total USD</span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">
            ${stats.rejectedTotal.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{stats.rejected} rejected receipts</p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-slate-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-purple-400 font-medium uppercase tracking-wider mb-2">
            <span>Fake Total USD</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-purple-400 font-mono">
            ${stats.fakeTotal.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{stats.fake} flagged fraudulent</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md shadow-xl">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
          Daily Approved Revenue & Volume for {selectedMonth}
        </h4>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
                formatter={(value: any, name: any) => {
                  if (name === 'approvedAmount') return [`$${Number(value).toFixed(2)}`, 'Approved Revenue'];
                  if (name === 'totalCount') return [value, 'Total Submissions'];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="approvedAmount" name="Approved Amount ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalCount" name="Total Submissions" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
