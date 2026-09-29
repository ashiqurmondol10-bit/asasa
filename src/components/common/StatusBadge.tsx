import React from 'react';
import type { PaymentStatus, TelegramSyncStatus } from '../../types/payment';
import { CheckCircle2, Clock, XCircle, AlertTriangle, AlertCircle, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: PaymentStatus;
  syncStatus?: TelegramSyncStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  syncStatus,
  showIcon = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-xs py-1 px-2.5',
    lg: 'text-sm py-1.5 px-3.5',
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'APPROVED':
        return {
          label: 'Approved',
          icon: CheckCircle2,
          className: 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-medium',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          icon: XCircle,
          className: 'bg-rose-950/70 border border-rose-500/30 text-rose-400 font-medium',
        };
      case 'FAKE':
        return {
          label: 'Fake Screenshot',
          icon: AlertTriangle,
          className: 'bg-purple-950/70 border border-purple-500/30 text-purple-400 font-medium',
        };
      case 'PENDING':
      default:
        return {
          label: 'Pending Review',
          icon: Clock,
          className: 'bg-amber-950/70 border border-amber-500/30 text-amber-400 font-medium',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-md ${config.className} ${sizeClasses[size]}`}
      >
        {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        <span>{config.label}</span>
      </span>

      {syncStatus && (
        <span
          title={`Telegram sync: ${syncStatus}`}
          className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border ${
            syncStatus === 'SYNCED'
              ? 'border-emerald-500/20 text-emerald-400/80 bg-emerald-950/30'
              : syncStatus === 'FAILED'
              ? 'border-rose-500/30 text-rose-400 bg-rose-950/40'
              : 'border-slate-700 text-slate-400 bg-slate-800/40'
          }`}
        >
          {syncStatus === 'SYNCED' && <Check className="w-2.5 h-2.5 mr-0.5" />}
          {syncStatus === 'FAILED' && <AlertCircle className="w-2.5 h-2.5 mr-0.5" />}
          TG: {syncStatus}
        </span>
      )}
    </div>
  );
};
