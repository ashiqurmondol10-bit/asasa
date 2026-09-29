import React, { useState, useMemo } from 'react';
import { Search, User, ExternalLink, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import type { UserRecord } from '../../types/payment';

interface UserTableProps {
  users: UserRecord[];
  onSelectUser: (user: UserRecord) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase().trim();
    return users.filter((u) => {
      const matchId = u.telegramUserId.toLowerCase().includes(term);
      const matchUsername = u.username.toLowerCase().includes(term);
      const matchName = `${u.firstName} ${u.lastName}`.toLowerCase().includes(term);
      return matchId || matchUsername || matchName;
    });
  }, [users, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search Toolbar */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Telegram User ID, Username, or Name..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'} registered
        </span>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Telegram User ID</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4 text-center">Total</th>
                <th className="py-3.5 px-4 text-center">Approved</th>
                <th className="py-3.5 px-4 text-center">Pending</th>
                <th className="py-3.5 px-4 text-center">Rejected / Fake</th>
                <th className="py-3.5 px-4 text-right">Total Approved ($)</th>
                <th className="py-3.5 px-4">First Payment</th>
                <th className="py-3.5 px-4">Last Payment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <User className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">No Telegram users yet</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {users.length === 0
                          ? 'Telegram user profiles are automatically created whenever a user sends their first payment screenshot to your bot.'
                          : 'No users match your search term.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.telegramUserId}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-sky-400">
                      <button
                        onClick={() => onSelectUser(u)}
                        className="hover:underline cursor-pointer"
                      >
                        {u.telegramUserId}
                      </button>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {u.username ? (
                        <span className="text-sky-300/90">{u.username}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-200">
                      {u.firstName} {u.lastName}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-200">
                      {u.totalPayments}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-emerald-400 font-semibold">
                        {u.approvedPayments}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-amber-400 font-semibold">
                        {u.pendingPayments}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      <span className="text-rose-400">{u.rejectedPayments}</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span className="text-purple-400">{u.fakePayments}</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      ${u.totalApprovedAmount.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {u.firstPaymentDate ? new Date(u.firstPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {u.lastPaymentDate ? new Date(u.lastPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectUser(u)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <span>History</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                      </button>
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
