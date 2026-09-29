import React, { useState, useMemo } from 'react';
import { History, Search, Layers, Clock, User, Shield } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';

export const ActivityPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const logs = useLiveQuery(
    () => db.activityLogs.reverse().toArray(),
    []
  ) || [];

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase().trim();
    return logs.filter((log) => {
      return (
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        (log.paymentId && log.paymentId.toLowerCase().includes(term)) ||
        log.adminUser.toLowerCase().includes(term)
      );
    });
  }, [logs, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Search Toolbar */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by action, details, payment ID, or admin..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {filteredLogs.length} audit event{filteredLogs.length === 1 ? '' : 's'} recorded
        </span>
      </div>

      {/* Activity Log List */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl">
        <div className="divide-y divide-slate-800/60">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No activity logged yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Administrative changes, amount edits, approvals, and webhook receptions will be automatically logged here.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">{log.action}</span>
                    {log.paymentId && (
                      <span className="font-mono text-[11px] text-sky-400 bg-sky-950/50 border border-sky-500/20 px-2 py-0.5 rounded">
                        {log.paymentId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{log.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-300 font-mono">
                    {new Date(log.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    Operator: {log.adminUser}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
