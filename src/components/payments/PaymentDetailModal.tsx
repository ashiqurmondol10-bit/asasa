import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  User,
  MessageSquare,
  FileText,
  Lock,
  Save,
  Send,
  Calendar,
  Layers,
} from 'lucide-react';
import type { PaymentRecord, PaymentStatus } from '../../types/payment';
import { StatusBadge } from '../common/StatusBadge';
import { apiClient } from '../../services/apiClient';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';

interface PaymentDetailModalProps {
  payment: PaymentRecord;
  onClose: () => void;
  onOpenStatusModal: (payment: PaymentRecord, status: PaymentStatus) => void;
  onOpenAmountModal: (payment: PaymentRecord) => void;
  onSaveNotes: (paymentId: string, adminNote: string, internalReport: string) => Promise<void>;
  onRetrySync: (payment: PaymentRecord) => Promise<void>;
  onViewScreenshot: (fileId: string, paymentId: string) => void;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  payment,
  onClose,
  onOpenStatusModal,
  onOpenAmountModal,
  onSaveNotes,
  onRetrySync,
  onViewScreenshot,
}) => {
  const [adminNote, setAdminNote] = useState(payment.adminNote || '');
  const [internalReport, setInternalReport] = useState(payment.internalReport || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  // Live query activity logs for this payment
  const activityLogs = useLiveQuery(
    () => db.activityLogs.where('paymentId').equals(payment.id).reverse().toArray(),
    [payment.id]
  ) || [];

  const imageUrl = apiClient.getTelegramImageProxyUrl(payment.telegramFileId);

  const finalAmount = payment.editedAmount !== null && payment.editedAmount !== undefined
    ? payment.editedAmount
    : payment.originalAmount;

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      await onSaveNotes(payment.id, adminNote, internalReport);
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2500);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleRetryTelegramSync = async () => {
    try {
      setIsRetryingSync(true);
      await onRetrySync(payment);
    } finally {
      setIsRetryingSync(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-white tracking-wide">{payment.id}</span>
            <StatusBadge status={payment.status} syncStatus={payment.telegramSyncStatus} size="sm" />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Grid: Screenshot Preview on Left, Details & Actions on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Screenshot Card (5 cols) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative flex-1 min-h-[320px] rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden group flex items-center justify-center p-2">
                <img
                  src={imageUrl}
                  alt={`Screenshot for ${payment.id}`}
                  className="max-h-[380px] w-auto rounded-lg object-contain transition-transform group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button
                    onClick={() => onViewScreenshot(payment.telegramFileId, payment.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Expand View</span>
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="font-mono truncate max-w-[200px]" title={payment.telegramFileId}>
                  File: {payment.telegramFileId.slice(0, 16)}...
                </span>
                <button
                  onClick={() => onViewScreenshot(payment.telegramFileId, payment.id)}
                  className="text-sky-400 hover:underline cursor-pointer"
                >
                  Full Resolution
                </button>
              </div>

              {/* Caption from Telegram */}
              {payment.caption && (
                <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>User Caption</span>
                  </div>
                  <p className="text-xs text-slate-200 font-mono italic whitespace-pre-wrap">{payment.caption}</p>
                </div>
              )}
            </div>

            {/* Financial & User Info (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Financial Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Financial Verification
                  </span>
                  <button
                    onClick={() => onOpenAmountModal(payment)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-950/40 px-3 py-1 text-xs font-medium text-sky-300 hover:bg-sky-900/50 transition-colors cursor-pointer"
                  >
                    <span>Edit Amount</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800/80">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Original</span>
                    <span className="mt-1 text-base font-bold text-slate-300 block">
                      ${payment.originalAmount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">From Telegram</span>
                  </div>

                  <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800/80">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Edited</span>
                    <span className="mt-1 text-base font-bold text-slate-300 block">
                      {payment.editedAmount !== null ? `$${payment.editedAmount.toFixed(2)}` : 'None'}
                    </span>
                    <span className="text-[10px] text-slate-500">Admin override</span>
                  </div>

                  <div className="rounded-lg bg-emerald-950/30 p-3 border border-emerald-500/20">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 block font-medium">Final Accounting</span>
                    <span className="mt-1 text-base font-bold text-emerald-300 block">
                      ${finalAmount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-500/80">{payment.currency || 'USD'}</span>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Update Payment Status
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => onOpenStatusModal(payment, 'APPROVED')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
                      payment.status === 'APPROVED'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                        : 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => onOpenStatusModal(payment, 'REJECTED')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
                      payment.status === 'REJECTED'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/50'
                        : 'bg-rose-950/50 text-rose-300 border border-rose-500/30 hover:bg-rose-900/50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => onOpenStatusModal(payment, 'FAKE')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer ${
                      payment.status === 'FAKE'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/50'
                        : 'bg-purple-950/50 text-purple-300 border border-purple-500/30 hover:bg-purple-900/50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Flag Fake</span>
                  </button>
                </div>

                {/* Telegram Sync Info & Retry button */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Telegram Status: <strong className="text-slate-300">{payment.telegramSyncStatus}</strong>
                      {payment.telegramStatusMessageId && ` (Msg ID: ${payment.telegramStatusMessageId})`}
                    </span>
                  </div>
                  {payment.telegramSyncStatus === 'FAILED' && (
                    <button
                      onClick={handleRetryTelegramSync}
                      disabled={isRetryingSync}
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline cursor-pointer"
                    >
                      <RotateCcw className={`w-3 h-3 ${isRetryingSync ? 'animate-spin' : ''}`} />
                      <span>Retry Notification</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Telegram User ID
                  </span>
                  <span className="font-mono text-slate-200 font-semibold">{payment.telegramUserId}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Username</span>
                  <span className="text-sky-400 font-medium">{payment.telegramUsername || 'None'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Full Name</span>
                  <span className="text-slate-200 font-medium">
                    {payment.telegramFirstName} {payment.telegramLastName}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Telegram Chat ID</span>
                  <span className="font-mono text-slate-300">{payment.telegramChatId}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Telegram Message ID</span>
                  <span className="font-mono text-slate-300">{payment.telegramMessageId}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Received At
                  </span>
                  <span className="text-slate-300">
                    {new Date(payment.receivedAt).toLocaleString('en-US')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Last Updated
                  </span>
                  <span className="text-slate-300">
                    {new Date(payment.updatedAt).toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Admin Notes (Internal Only) & Activity Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-slate-800">
            {/* Admin Notes & Report */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Internal Admin Notes & Reports
                </span>
                <span className="text-[10px] text-amber-400/90 font-medium px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20">
                  Strictly Confidential
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Admin Internal Note
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Private internal note regarding this transaction..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Internal Verification Report
                </label>
                <textarea
                  rows={3}
                  value={internalReport}
                  onChange={(e) => setInternalReport(e.target.value)}
                  placeholder="Detailed fraud or audit check notes..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500">Never exposed to Telegram user.</p>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Saving...' : notesSavedSuccess ? 'Saved!' : 'Save Notes'}</span>
                </button>
              </div>
            </div>

            {/* Activity History Timeline */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Audit Trail & History
              </span>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-[220px] pr-2">
                {activityLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No activity records yet.</p>
                ) : (
                  activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{log.details}</p>
                      <span className="text-[10px] text-slate-500 block font-mono">By: {log.adminUser}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
