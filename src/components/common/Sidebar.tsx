import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  CalendarRange,
  BarChart3,
  History,
  Settings,
  Search,
  ExternalLink,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import type { PaymentStatus } from '../../types/payment';

export type NavTab =
  | 'dashboard'
  | 'payments'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'fake'
  | 'users'
  | 'daily-reports'
  | '15day-reports'
  | 'monthly-reports'
  | 'activity'
  | 'settings'
  | 'lookup';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts: Record<PaymentStatus | 'ALL', number>;
  isOpen: boolean;
  onClose: () => void;
  botConfigured?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  isOpen,
  onClose,
  botConfigured = false,
}) => {
  const mainNav = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'payments' as NavTab, label: 'All Payments', icon: Receipt, badge: counts.ALL },
    { id: 'pending' as NavTab, label: 'Pending Review', icon: Clock, badge: counts.PENDING, badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
    { id: 'approved' as NavTab, label: 'Approved', icon: CheckCircle2, badge: counts.APPROVED, badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    { id: 'rejected' as NavTab, label: 'Rejected', icon: XCircle, badge: counts.REJECTED, badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
    { id: 'fake' as NavTab, label: 'Fake Screenshots', icon: AlertTriangle, badge: counts.FAKE, badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
    { id: 'users' as NavTab, label: 'Users', icon: Users },
  ];

  const reportsNav = [
    { id: 'daily-reports' as NavTab, label: 'Daily Reports', icon: Calendar },
    { id: '15day-reports' as NavTab, label: '15-Day Reports', icon: CalendarRange },
    { id: 'monthly-reports' as NavTab, label: 'Monthly Reports', icon: BarChart3 },
    { id: 'activity' as NavTab, label: 'Activity Log', icon: History },
  ];

  const systemNav = [
    { id: 'lookup' as NavTab, label: 'Public User Lookup', icon: Search },
    { id: 'settings' as NavTab, label: 'Bot & Webhook Settings', icon: Settings },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
                TelePay <span className="text-[11px] font-normal uppercase tracking-wider text-sky-400">Admin</span>
              </h1>
              <p className="text-[11px] text-slate-400">Telegram Screenshot Audit</p>
            </div>
          </div>
        </div>

        {/* Telegram Bot Status Bar */}
        <div className="border-b border-slate-800/80 px-5 py-2.5 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300 font-medium">Telegram Bot</span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                botConfigured
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-950/70 text-amber-400 border border-amber-500/30'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  botConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {botConfigured ? 'Connected' : 'Token Needed'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Category */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Payment Management
            </div>
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 transition-colors ${
                          isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          item.badgeColor || 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Reports Category */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Accounting & Reports
            </div>
            <nav className="space-y-1">
              {reportsNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* System & Tools */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              System & Tools
            </div>
            <nav className="space-y-1">
              {systemNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Database Footer note */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-lg bg-slate-900/70 p-3 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-300">Local Dexie DB</span>
              <span className="text-[11px] text-emerald-400 font-mono">IndexedDB</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Payments stored in browser local database. Telegram media streamed via secure API proxy.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
