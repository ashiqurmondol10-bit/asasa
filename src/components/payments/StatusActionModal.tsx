import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Send, ShieldAlert } from 'lucide-react';
import type { PaymentRecord, PaymentStatus } from '../../types/payment';

interface StatusActionModalProps {
  payment: PaymentRecord;
  targetStatus: PaymentStatus;
  onConfirm: (paymentId: string, status: PaymentStatus, note?: string) => Promise<void>;
  onClose: () => void;
}

export const StatusActionModal: React.FC<StatusActionModalProps> = ({
  payment,
  targetStatus,
  onConfirm,
  onClose,
}) => {
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalAmount = payment.editedAmount !== null && payment.editedAmount !== undefined
    ? payment.editedAmount
    : payment.originalAmount;

  const formattedAmount = `${payment.currency === 'USD' ? '$' : `${payment.currency} `}${finalAmount.toFixed(2)}`;

  const getModalConfig = () => {
    switch (targetStatus) {
      case 'APPROVED':
        return {
          title: 'Approve Payment',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20',
          telegramPreview: `✅ PAYMENT APPROVED\n\nAmount: ${formattedAmount}\nPayment ID: ${payment.id}\n\nYour payment has been successfully verified.`,
          warningText: 'This will confirm the payment, credit to financial accounting totals, and notify the Telegram user.',
        };
      case 'REJECTED':
        return {
          title: 'Reject Payment',
          icon: XCircle,
          iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          btnBg: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20',
          telegramPreview: `❌ PAYMENT REJECTED\n\nPayment ID: ${payment.id}\n\nYour payment verification was rejected.`,
          warningText: 'This will mark the payment rejected and notify the Telegram user. Internal notes are strictly kept private.',
        };
      case 'FAKE':
        return {
          title: 'Mark as Fake Screenshot',
          icon: AlertTriangle,
          iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          btnBg: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20',
          telegramPreview: `🚫 FAKE SCREENSHOT\n\nPayment ID: ${payment.id}\n\nThis screenshot was flagged as invalid or altered.`,
          warningText: 'Flag screenshot as fraudulent/altered. User will receive the public warning message. Internal audit is kept private.',
        };
      case 'PENDING':
      default:
        return {
          title: 'Reset to Pending',
          icon: AlertTriangle,
          iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          btnBg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20',
          telegramPreview: `⏳ PAYMENT PENDING\n\nPayment ID: ${payment.id}\n\nYour payment is currently under review.`,
          warningText: 'Reset payment status back to pending review.',
        };
    }
  };

  const config = getModalConfig();
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(payment.id, targetStatus, adminNote);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 border ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{config.title}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {payment.id} · User: @{payment.telegramUsername || payment.telegramUserId}
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

        <div className="mt-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">{config.warningText}</p>

          {/* Telegram Public Status Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Send className="w-3 h-3 text-sky-400" />
                Public Telegram Message Preview
              </span>
              <span className="text-[10px] text-slate-500">Sent to chat {payment.telegramChatId}</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed shadow-inner">
              {config.telegramPreview}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Strict Privacy: Internal notes and reports are NEVER sent to Telegram.</span>
            </p>
          </div>

          {/* Internal admin note */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Internal Admin Note (Private Audit Log)
            </label>
            <textarea
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="e.g. Verified via banking portal reference #49281"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-medium text-white transition-all disabled:opacity-50 cursor-pointer shadow-md ${config.btnBg}`}
            >
              <Icon className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : `Confirm ${targetStatus}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
