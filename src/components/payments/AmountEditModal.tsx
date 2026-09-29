import React, { useState } from 'react';
import { X, DollarSign, AlertCircle, Check } from 'lucide-react';
import type { PaymentRecord } from '../../types/payment';

interface AmountEditModalProps {
  payment: PaymentRecord;
  onSave: (paymentId: string, newAmount: number, note: string) => Promise<void>;
  onClose: () => void;
}

export const AmountEditModal: React.FC<AmountEditModalProps> = ({
  payment,
  onSave,
  onClose,
}) => {
  const currentFinal = payment.editedAmount !== null && payment.editedAmount !== undefined
    ? payment.editedAmount
    : payment.originalAmount;

  const [amountStr, setAmountStr] = useState(String(currentFinal || ''));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = parseFloat(amountStr);
  const isValid = !isNaN(parsedAmount) && parsedAmount >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError('Please enter a valid non-negative number');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(payment.id, parsedAmount, note);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400 border border-sky-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Edit Payment Amount</h3>
              <p className="text-xs text-slate-400 font-mono">{payment.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Amount Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Original Amount</span>
              <p className="mt-1 text-lg font-bold text-slate-200">
                ${payment.originalAmount.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-500">Preserved permanently</span>
            </div>

            <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-3">
              <span className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">Current Final</span>
              <p className="mt-1 text-lg font-bold text-sky-300">
                ${currentFinal.toFixed(2)}
              </p>
              <span className="text-[10px] text-sky-500/80">
                {payment.editedAmount !== null ? 'Modified' : 'Unmodified'}
              </span>
            </div>
          </div>

          {/* New Amount input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              New Final Amount ({payment.currency || 'USD'})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-8 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Note input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Audit Reason / Note (Internal Admin Only)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bank fee adjustment, corrected typo in receipt"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              🔒 Internal only. Never exposed or sent to Telegram user.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
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
              type="submit"
              disabled={isSubmitting || !isValid}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-500 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-sky-600/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save New Amount'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
