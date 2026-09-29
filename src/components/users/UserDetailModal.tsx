import React from 'react';
import { X, User, DollarSign, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import type { UserRecord, PaymentRecord } from '../../types/payment';
import { StatusBadge } from '../common/StatusBadge';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';

interface UserDetailModalProps {
  user: UserRecord;
  onClose: () => void;
  onSelectPayment: (payment: PaymentRecord) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  onClose,
  onSelectPayment,
}) => {
  const userPayments = useLiveQuery(
    () => db.payments.where('telegramUserId').equals(user.telegramUserId).reverse().toArray(),
    [user.telegramUserId]
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-400 border border-sky-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {user.username || 'No username'} · Telegram ID: {user.telegramUserId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Received</span>
              <p className="mt-1 text-xl font-bold text-white">{user.totalPayments}</p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
              <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Approved Volume</span>
              <p className="mt-1 text-xl font-bold text-emerald-400">
                ${user.totalApprovedAmount.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Approved / Pending</span>
              <p className="mt-1 text-base font-bold text-slate-200">
                {user.approvedPayments} <span className="text-slate-500 text-xs font-normal">/ {user.pendingPayments}</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Rejected / Fake</span>
              <p className="mt-1 text-base font-bold text-slate-200">
                {user.rejectedPayments} <span className="text-slate-500 text-xs font-normal">/ {user.fakePayments}</span>
              </p>
            </div>
          </div>

          {/* User Payments List */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Payment Submission History ({userPayments.length})
            </h4>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">Payment ID</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {userPayments.map((p) => {
                    const finalAmt = p.editedAmount !== null && p.editedAmount !== undefined ? p.editedAmount : p.originalAmount;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-sky-400">{p.id}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-white">${finalAmt.toFixed(2)}</td>
                        <td className="py-2.5 px-4">
                          <StatusBadge status={p.status} syncStatus={p.telegramSyncStatus} size="sm" />
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          {new Date(p.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => {
                              onSelectPayment(p);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
