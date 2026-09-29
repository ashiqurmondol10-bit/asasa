import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'amber' | 'rose' | 'purple' | 'blue' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'slate',
  onClick,
}) => {
  const variantStyles = {
    emerald: {
      card: 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-900/40 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      value: 'text-emerald-400',
    },
    amber: {
      card: 'border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-slate-900/40 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      value: 'text-amber-400',
    },
    rose: {
      card: 'border-rose-500/20 bg-gradient-to-br from-rose-950/30 via-slate-900/60 to-slate-900/40 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      value: 'text-rose-400',
    },
    purple: {
      card: 'border-purple-500/20 bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-slate-900/40 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      value: 'text-purple-400',
    },
    blue: {
      card: 'border-blue-500/20 bg-gradient-to-br from-blue-950/30 via-slate-900/60 to-slate-900/40 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      value: 'text-blue-400',
    },
    slate: {
      card: 'border-slate-800 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-950/40 hover:border-slate-700',
      iconBg: 'bg-slate-800 text-slate-300 border border-slate-700',
      value: 'text-slate-100',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border p-5 backdrop-blur-md transition-all duration-200 ${
        style.card
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5 shadow-lg shadow-black/20' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${style.value}`}>{value}</span>
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
