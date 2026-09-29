import React from 'react';
import {
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { usePaymentStats } from '../hooks/usePaymentStats';
import type { PaymentRecord, PaymentStatus } from '../types/payment';
import { PaymentTable } from '../components/payments/PaymentTable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardPageProps {
  onNavigateTab: (tab: any) => void;
  onViewPayment: (payment: PaymentRecord) => void;
  onOpenStatusModal: (payment: PaymentRecord, status: PaymentStatus) => void;
  onOpenAmountModal: (payment: PaymentRecord) => void;
  onViewScreenshot: (fileId: string, paymentId: string) => void;
  onSimulateWebhook: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateTab,
  onViewPayment,
  onOpenStatusModal,
  onOpenAmountModal,
  onViewScreenshot,
  onSimulateWebhook,
}) => {
  const {
    payments,
    counts,
    totalApprovedAmount,
    todayApprovedAmount,
    currentMonthApprovedAmount,
    dailyTrend,
    statusDistribution,
  } = usePaymentStats();

  return (
    <div className="space-y-8">
      {/* Financial Overview Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Financial Revenue Metrics (Strictly Approved Payments)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Final Amount = Edited Amount ?? Original Amount
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Approved Revenue"
            value={`$${totalApprovedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Lifetime settled revenue"
            icon={DollarSign}
            variant="emerald"
            onClick={() => onNavigateTab('approved')}
          />
          <StatCard
            title="Today's Approved"
            value={`$${todayApprovedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Approved during today's calendar date"
            icon={TrendingUp}
            variant="blue"
            onClick={() => onNavigateTab('daily-reports')}
          />
          <StatCard
            title="Current Month Approved"
            value={`$${currentMonthApprovedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Current calendar month total"
            icon={Calendar}
            variant="emerald"
            onClick={() => onNavigateTab('monthly-reports')}
          />
        </div>
      </div>

      {/* Payment Status Counts */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Payment Receipt Status Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard
            title="Total Receipts"
            value={counts.ALL}
            subtitle="All screenshots received"
            icon={Receipt}
            variant="slate"
            onClick={() => onNavigateTab('payments')}
          />
          <StatCard
            title="Pending Review"
            value={counts.PENDING}
            subtitle="Awaiting admin action"
            icon={Clock}
            variant="amber"
            onClick={() => onNavigateTab('pending')}
          />
          <StatCard
            title="Approved"
            value={counts.APPROVED}
            subtitle="Verified transactions"
            icon={CheckCircle2}
            variant="emerald"
            onClick={() => onNavigateTab('approved')}
          />
          <StatCard
            title="Rejected"
            value={counts.REJECTED}
            subtitle="Failed verification"
            icon={XCircle}
            variant="rose"
            onClick={() => onNavigateTab('rejected')}
          />
          <StatCard
            title="Fake Flags"
            value={counts.FAKE}
            subtitle="Flagged fraudulent"
            icon={AlertTriangle}
            variant="purple"
            onClick={() => onNavigateTab('fake')}
          />
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Approved Revenue Trend (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                14-Day Approved Revenue Trend ($)
              </h4>
              <p className="text-[11px] text-slate-500">Daily financial volume generated from approved receipts</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">Live Real-Time Data</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'approvedAmount') return [`$${Number(value).toFixed(2)}`, 'Approved Amount'];
                    return [value, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="approvedAmount"
                  name="Approved Amount ($)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#approvedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md shadow-xl flex flex-col">
          <div className="mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Status Distribution
            </h4>
            <p className="text-[11px] text-slate-500">Proportion of receipt decisions</p>
          </div>

          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            {statusDistribution.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-8">
                No payment data received yet to plot distribution.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Payment Receipts</h3>
            <p className="text-xs text-slate-400">Latest submissions requiring audit and action</p>
          </div>
          <button
            onClick={() => onNavigateTab('payments')}
            className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
          >
            <span>View All Payments ({counts.ALL})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <PaymentTable
          payments={payments.slice(0, 8)}
          onViewPayment={onViewPayment}
          onOpenStatusModal={onOpenStatusModal}
          onOpenAmountModal={onOpenAmountModal}
          onViewScreenshot={onViewScreenshot}
        />
      </div>
    </div>
  );
};
