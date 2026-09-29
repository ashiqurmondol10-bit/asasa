import React from 'react';
import { Menu, RefreshCw, Zap, Shield, Bell, CheckCircle2 } from 'lucide-react';
import type { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onOpenSidebar: () => void;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  onManualSync: () => void;
  newArrivalsNotification: string | null;
  onClearNotification: () => void;
  onQuickSimulate?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenSidebar,
  isSyncing,
  lastSyncTime,
  onManualSync,
  newArrivalsNotification,
  onClearNotification,
  onQuickSimulate,
}) => {
  const getTabTitle = (tab: NavTab): { title: string; subtitle: string } => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Executive Dashboard', subtitle: 'Overview of incoming Telegram payment receipts & approvals' };
      case 'payments':
        return { title: 'All Payments', subtitle: 'Complete register of payment screenshots received from Telegram' };
      case 'pending':
        return { title: 'Pending Review', subtitle: 'Screenshots awaiting administrative verification' };
      case 'approved':
        return { title: 'Approved Payments', subtitle: 'Verified receipts that contribute to accounting totals' };
      case 'rejected':
        return { title: 'Rejected Payments', subtitle: 'Screenshots that failed verification' };
      case 'fake':
        return { title: 'Fake Screenshots', subtitle: 'Flagged invalid, fabricated, or duplicate attempts' };
      case 'users':
        return { title: 'Telegram Users', subtitle: 'Customer profiles and historical payment performance' };
      case 'daily-reports':
        return { title: 'Daily Report', subtitle: 'Date-specific accounting and status reconciliation' };
      case '15day-reports':
        return { title: '15-Day Accounting Report', subtitle: 'Mid-month settlement and user-wise volumes' };
      case 'monthly-reports':
        return { title: 'Monthly Financial Report', subtitle: 'Monthly revenue metrics and status breakdown' };
      case 'activity':
        return { title: 'Activity Audit Log', subtitle: 'Timestamped record of administrative and system events' };
      case 'lookup':
        return { title: 'Public Customer Lookup', subtitle: 'Customer-facing verification portal without internal notes' };
      case 'settings':
        return { title: 'Bot & Webhook Settings', subtitle: 'Telegram Bot API credentials, webhook URL, and diagnostics' };
      default:
        return { title: 'TelePay Admin', subtitle: 'Payment screenshot management' };
    }
  };

  const { title, subtitle } = getTabTitle(currentTab);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      {/* New arrivals toast banner */}
      {newArrivalsNotification && (
        <div className="bg-sky-500/10 border-b border-sky-500/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-sky-300">
            <Bell className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
            <span className="font-medium">{newArrivalsNotification}</span>
          </div>
          <button
            onClick={onClearNotification}
            className="text-xs text-sky-400 hover:text-sky-200 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight leading-none">{title}</h1>
            <p className="mt-1 hidden text-xs text-slate-400 sm:block">{subtitle}</p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-3">
          {/* Quick Simulate Button for instant testing */}
          {onQuickSimulate && (
            <button
              onClick={onQuickSimulate}
              title="Send a sample webhook payment to test the ingestion pipeline"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-900/50 transition-colors shadow-sm cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simulate Webhook</span>
            </button>
          )}

          {/* Sync Polling Indicator */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isSyncing ? 'animate-ping bg-sky-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isSyncing ? 'bg-sky-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="hidden md:inline text-slate-400">
              {isSyncing ? 'Syncing...' : lastSyncTime ? `Synced ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Live Polling'}
            </span>
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              title="Force sync pending webhook payments now"
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
