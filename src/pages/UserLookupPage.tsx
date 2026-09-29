import React, { useState } from 'react';
import { Search, Shield, CheckCircle2, Clock, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { paymentService } from '../db/paymentService';
import type { PublicUserLookupResult, PaymentStatus } from '../types/payment';

interface UserLookupPageProps {
  onBackToDashboard?: () => void;
}

export const UserLookupPage: React.FC<UserLookupPageProps> = ({ onBackToDashboard }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PublicUserLookupResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await paymentService.getPublicUserLookup(query.trim());
      setResult(data);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-500/30 text-rose-400">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'FAKE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-950/80 border border-purple-500/30 text-purple-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Flagged Invalid
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-500/30 text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            Under Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button if in admin dashboard */}
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      )}

      {/* Hero header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Payment Verification Status Portal
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Enter your Telegram User ID or username to securely check your verified payment receipts and status.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mt-6 max-w-md mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 123456789 or @username"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-sky-600/20"
          >
            {loading ? 'Searching...' : 'Check Status'}
          </button>
        </form>

        <p className="mt-3 text-[11px] text-slate-500">
          🔒 Secure Verification: Only publicly permitted receipt statuses are shown. Internal administrative data is strictly protected.
        </p>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          {!result ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-md">
              <p className="text-sm font-semibold text-slate-300">No payment records found</p>
              <p className="mt-1 text-xs text-slate-500">
                We could not find any payments associated with "{query}". Please make sure you sent a payment screenshot to our Telegram Bot.
              </p>
            </div>
          ) : (
            <>
              {/* User Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Submissions</span>
                  <p className="mt-1 text-2xl font-bold text-white font-mono">{result.paymentCount}</p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                  <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Approved Volume</span>
                  <p className="mt-1 text-2xl font-bold text-emerald-400 font-mono">
                    ${result.approvedAmount.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Approved / Pending</span>
                  <p className="mt-1 text-base font-bold text-slate-200">
                    <span className="text-emerald-400 font-mono">{result.currentStatuses.APPROVED}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-amber-400 font-mono">{result.currentStatuses.PENDING}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Telegram ID</span>
                  <p className="mt-1 text-xs font-mono font-bold text-sky-400 truncate">
                    {result.telegramUserId}
                  </p>
                </div>
              </div>

              {/* Payments History List */}
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl">
                <div className="border-b border-slate-800 bg-slate-950/80 px-5 py-3.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Verified Payment History ({result.payments.length})
                  </h3>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {result.payments.map((p, idx) => (
                    <div
                      key={p.paymentId}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Payment #{result.payments.length - idx}</span>
                          <span className="font-mono text-xs font-bold text-sky-400">{p.paymentId}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Submitted: {new Date(p.date).toLocaleString('en-US')}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-mono text-base font-bold text-white block">
                            ${p.amount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">{p.currency}</span>
                        </div>
                        <div>{getStatusBadge(p.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
