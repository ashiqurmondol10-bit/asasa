import React, { useState, useMemo } from 'react';
import {
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Search,
  Download,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import type { PaymentRecord, PaymentStatus } from '../../types/payment';
import { StatusBadge } from '../common/StatusBadge';
import { apiClient } from '../../services/apiClient';
import { exportPaymentsToCSV } from '../../services/exportService';

interface PaymentTableProps {
  payments: PaymentRecord[];
  filterStatus?: PaymentStatus | 'ALL';
  onViewPayment: (payment: PaymentRecord) => void;
  onOpenStatusModal: (payment: PaymentRecord, status: PaymentStatus) => void;
  onOpenAmountModal: (payment: PaymentRecord) => void;
  onViewScreenshot: (fileId: string, paymentId: string) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  filterStatus = 'ALL',
  onViewPayment,
  onOpenStatusModal,
  onOpenAmountModal,
  onViewScreenshot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'ALL'>(filterStatus);
  const [sortField, setSortField] = useState<'receivedAt' | 'finalAmount' | 'status'>('receivedAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Sync internal selectedStatus if parent filterStatus changes
  React.useEffect(() => {
    setSelectedStatus(filterStatus);
  }, [filterStatus]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        // Status filter
        if (selectedStatus !== 'ALL' && p.status !== selectedStatus) {
          return false;
        }

        // Search term filter (ID, user, username, caption)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const matchId = p.id.toLowerCase().includes(term);
          const matchUser = p.telegramUserId.toLowerCase().includes(term);
          const matchUsername = p.telegramUsername.toLowerCase().includes(term);
          const matchName = `${p.telegramFirstName} ${p.telegramLastName}`.toLowerCase().includes(term);
          const matchCaption = (p.caption || '').toLowerCase().includes(term);
          if (!matchId && !matchUser && !matchUsername && !matchName && !matchCaption) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'receivedAt') {
          const diff = new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
          return sortAsc ? diff : -diff;
        }
        if (sortField === 'finalAmount') {
          const amtA = a.editedAmount !== null && a.editedAmount !== undefined ? a.editedAmount : a.originalAmount;
          const amtB = b.editedAmount !== null && b.editedAmount !== undefined ? b.editedAmount : b.originalAmount;
          return sortAsc ? amtA - amtB : amtB - amtA;
        }
        if (sortField === 'status') {
          return sortAsc ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
        }
        return 0;
      });
  }, [payments, selectedStatus, searchTerm, sortField, sortAsc]);

  const handleExportCSV = () => {
    exportPaymentsToCSV(filteredPayments, `telepay_payments_${selectedStatus.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const toggleSort = (field: 'receivedAt' | 'finalAmount' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl backdrop-blur-md">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Payment ID, User ID, @username, or caption..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Status filter selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg p-1 text-xs">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'FAKE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">
            {filteredPayments.length} record{filteredPayments.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={handleExportCSV}
            disabled={filteredPayments.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Payment Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Screenshot</th>
                <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => toggleSort('receivedAt')}>
                  <div className="flex items-center gap-1">
                    <span>Payment ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Telegram Username</th>
                <th className="py-3.5 px-4 text-right">Original</th>
                <th className="py-3.5 px-4 text-right">Edited</th>
                <th className="py-3.5 px-4 text-right cursor-pointer select-none" onClick={() => toggleSort('finalAmount')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Final Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => toggleSort('receivedAt')}>
                  <div className="flex items-center gap-1">
                    <span>Received</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">No payment screenshots found</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {payments.length === 0
                          ? 'Real payments will appear here as users send screenshot receipts to your Telegram Bot webhook. You can also click "Simulate Webhook" above to test the pipeline.'
                          : 'No payments match your current search and status filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const finalAmt = p.editedAmount !== null && p.editedAmount !== undefined ? p.editedAmount : p.originalAmount;
                  const thumbUrl = apiClient.getTelegramImageProxyUrl(p.telegramFileId);

                  return (
                    <tr
                      key={p.id}
                      className="group transition-colors hover:bg-slate-800/40"
                    >
                      {/* Thumbnail */}
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => onViewScreenshot(p.telegramFileId, p.id)}
                          className="relative h-12 w-12 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center hover:border-sky-500 transition-colors cursor-pointer group/thumb"
                          title="Click to view full screenshot"
                        >
                          <img
                            src={thumbUrl}
                            alt={p.id}
                            className="h-full w-full object-cover group-hover/thumb:scale-110 transition-transform"
                            loading="lazy"
                          />
                        </button>
                      </td>

                      {/* Payment ID */}
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => onViewPayment(p)}
                          className="font-mono font-semibold text-sky-400 hover:underline hover:text-sky-300 text-xs text-left cursor-pointer"
                        >
                          {p.id}
                        </button>
                        {p.caption && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[130px] font-mono mt-0.5">
                            "{p.caption}"
                          </p>
                        )}
                      </td>

                      {/* User */}
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-200">
                          {p.telegramFirstName} {p.telegramLastName}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">ID: {p.telegramUserId}</span>
                      </td>

                      {/* Telegram Username */}
                      <td className="py-2.5 px-4 font-mono text-slate-300">
                        {p.telegramUsername ? (
                          <span className="text-sky-400/90">{p.telegramUsername}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Original Amount */}
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                        ${p.originalAmount.toFixed(2)}
                      </td>

                      {/* Edited Amount */}
                      <td className="py-2.5 px-4 text-right font-mono">
                        {p.editedAmount !== null && p.editedAmount !== undefined ? (
                          <span className="text-sky-400 font-medium">
                            ${p.editedAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Final Amount */}
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                        ${finalAmt.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4">
                        <StatusBadge status={p.status} syncStatus={p.telegramSyncStatus} size="sm" />
                      </td>

                      {/* Received Time */}
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        <div className="text-[11px] text-slate-300">
                          {new Date(p.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(p.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewPayment(p)}
                            title="View Full Payment Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenAmountModal(p)}
                            title="Edit Amount"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-950/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {p.status !== 'APPROVED' && (
                            <button
                              onClick={() => onOpenStatusModal(p, 'APPROVED')}
                              title="Approve Payment"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {p.status !== 'REJECTED' && (
                            <button
                              onClick={() => onOpenStatusModal(p, 'REJECTED')}
                              title="Reject Payment"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {p.status !== 'FAKE' && (
                            <button
                              onClick={() => onOpenStatusModal(p, 'FAKE')}
                              title="Flag Fake Screenshot"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-950/40 transition-colors cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
