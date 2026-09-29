import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/dexie';
import { paymentService } from './db/paymentService';
import { apiClient } from './services/apiClient';
import { useSyncPayments } from './hooks/useSyncPayments';
import { usePaymentStats } from './hooks/usePaymentStats';
import type { PaymentRecord, PaymentStatus, UserRecord } from './types/payment';

import { Sidebar, type NavTab } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { PaymentTable } from './components/payments/PaymentTable';
import { UserTable } from './components/users/UserTable';
import { UserDetailModal } from './components/users/UserDetailModal';
import { PaymentDetailModal } from './components/payments/PaymentDetailModal';
import { AmountEditModal } from './components/payments/AmountEditModal';
import { StatusActionModal } from './components/payments/StatusActionModal';
import { ScreenshotViewerModal } from './components/payments/ScreenshotViewerModal';
import { DailyReportView } from './components/reports/DailyReportView';
import { FifteenDayReportView } from './components/reports/FifteenDayReportView';
import { MonthlyReportView } from './components/reports/MonthlyReportView';
import { UserWiseReportView } from './components/reports/UserWiseReportView';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserLookupPage } from './pages/UserLookupPage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [botConfigured, setBotConfigured] = useState(false);

  // Modal states
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [statusModalPayment, setStatusModalPayment] = useState<PaymentRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<PaymentStatus>('APPROVED');
  const [amountModalPayment, setAmountModalPayment] = useState<PaymentRecord | null>(null);
  const [viewerScreenshot, setViewerScreenshot] = useState<{ fileId: string; paymentId: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Sync payments hook
  const {
    isSyncing,
    lastSyncTime,
    newArrivalsNotification,
    clearNotification,
    triggerSync,
  } = useSyncPayments(4000);

  // Live queries from Dexie IndexedDB
  const payments = useLiveQuery(() => db.payments.reverse().toArray(), []) || [];
  const users = useLiveQuery(() => db.users.toArray(), []) || [];
  const { counts } = usePaymentStats();

  // Check bot token configuration on start
  useEffect(() => {
    apiClient.checkBotStatus().then((res) => {
      setBotConfigured(Boolean(res.configured && res.bot));
    }).catch(() => {
      setBotConfigured(false);
    });
  }, []);

  // Handlers for payments
  const handleOpenStatusModal = (payment: PaymentRecord, status: PaymentStatus) => {
    setStatusModalPayment(payment);
    setTargetStatus(status);
  };

  const handleConfirmStatusChange = async (paymentId: string, newStatus: PaymentStatus, note?: string) => {
    // 1. Update IndexedDB locally
    const updated = await paymentService.updateStatus(paymentId, newStatus, note, 'Admin');

    // If modal is open for this payment, refresh its view
    if (selectedPayment && selectedPayment.id === paymentId) {
      setSelectedPayment(updated);
    }

    // 2. Dispatch public status update to Telegram Bot
    try {
      const finalAmt = updated.editedAmount !== null && updated.editedAmount !== undefined
        ? updated.editedAmount
        : updated.originalAmount;

      const tgRes = await apiClient.updateTelegramPublicStatus({
        chatId: updated.telegramChatId,
        replyToMessageId: updated.telegramMessageId,
        existingStatusMessageId: updated.telegramStatusMessageId,
        status: newStatus,
        finalAmount: finalAmt,
        currency: updated.currency || 'USD',
        paymentId: updated.id,
      });

      if (tgRes.ok && tgRes.messageId) {
        await paymentService.updateTelegramSync(paymentId, 'SYNCED', tgRes.messageId);
      } else {
        await paymentService.updateTelegramSync(
          paymentId,
          'FAILED',
          null,
          tgRes.error || tgRes.warning || 'Telegram status notification failed'
        );
      }
    } catch (err: unknown) {
      console.warn('Telegram status notification network error', err);
      await paymentService.updateTelegramSync(
        paymentId,
        'FAILED',
        null,
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const handleConfirmAmountEdit = async (paymentId: string, newAmount: number, note: string) => {
    const updated = await paymentService.editAmount(paymentId, newAmount, note, 'Admin');
    if (selectedPayment && selectedPayment.id === paymentId) {
      setSelectedPayment(updated);
    }
  };

  const handleSaveNotes = async (paymentId: string, adminNote: string, internalReport: string) => {
    const updated = await paymentService.updateInternalNotes(paymentId, adminNote, internalReport, 'Admin');
    if (selectedPayment && selectedPayment.id === paymentId) {
      setSelectedPayment(updated);
    }
  };

  const handleRetryTelegramSync = async (payment: PaymentRecord) => {
    const finalAmt = payment.editedAmount !== null && payment.editedAmount !== undefined
      ? payment.editedAmount
      : payment.originalAmount;

    try {
      const tgRes = await apiClient.updateTelegramPublicStatus({
        chatId: payment.telegramChatId,
        replyToMessageId: payment.telegramMessageId,
        existingStatusMessageId: payment.telegramStatusMessageId,
        status: payment.status,
        finalAmount: finalAmt,
        currency: payment.currency || 'USD',
        paymentId: payment.id,
      });

      if (tgRes.ok && tgRes.messageId) {
        await paymentService.updateTelegramSync(payment.id, 'SYNCED', tgRes.messageId);
        const refreshed = await db.payments.get(payment.id);
        if (refreshed && selectedPayment?.id === payment.id) {
          setSelectedPayment(refreshed);
        }
      } else {
        await paymentService.updateTelegramSync(
          payment.id,
          'FAILED',
          null,
          tgRes.error || tgRes.warning || 'Failed to update'
        );
      }
    } catch (err: unknown) {
      await paymentService.updateTelegramSync(
        payment.id,
        'FAILED',
        null,
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const handleQuickSimulate = async () => {
    const randomAmount = Math.floor(50 + Math.random() * 450);
    await apiClient.simulateInboundPayment({
      caption: `Payment $${randomAmount}.00 for invoice`,
      amount: randomAmount,
    });
    await triggerSync();
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        counts={counts}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        botConfigured={botConfigured}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar
          currentTab={currentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
          onManualSync={triggerSync}
          newArrivalsNotification={newArrivalsNotification}
          onClearNotification={clearNotification}
          onQuickSimulate={handleQuickSimulate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigateTab={setCurrentTab}
              onViewPayment={(p) => setSelectedPayment(p)}
              onOpenStatusModal={handleOpenStatusModal}
              onOpenAmountModal={(p) => setAmountModalPayment(p)}
              onViewScreenshot={(fileId, paymentId) => setViewerScreenshot({ fileId, paymentId })}
              onSimulateWebhook={handleQuickSimulate}
            />
          )}

          {currentTab === 'payments' && (
            <div className="space-y-4">
              <PaymentTable
                payments={payments}
                filterStatus="ALL"
                onViewPayment={(p) => setSelectedPayment(p)}
                onOpenStatusModal={handleOpenStatusModal}
                onOpenAmountModal={(p) => setAmountModalPayment(p)}
                onViewScreenshot={(fileId, paymentId) => setViewerScreenshot({ fileId, paymentId })}
              />
            </div>
          )}

          {currentTab === 'pending' && (
            <div className="space-y-4">
              <PaymentTable
                payments={payments}
                filterStatus="PENDING"
                onViewPayment={(p) => setSelectedPayment(p)}
                onOpenStatusModal={handleOpenStatusModal}
                onOpenAmountModal={(p) => setAmountModalPayment(p)}
                onViewScreenshot={(fileId, paymentId) => setViewerScreenshot({ fileId, paymentId })}
              />
            </div>
          )}

          {currentTab === 'approved' && (
            <div className="space-y-4">
              <PaymentTable
                payments={payments}
                filterStatus="APPROVED"
                onViewPayment={(p) => setSelectedPayment(p)}
                onOpenStatusModal={handleOpenStatusModal}
                onOpenAmountModal={(p) => setAmountModalPayment(p)}
                onViewScreenshot={(fileId, paymentId) => setViewerScreenshot({ fileId, paymentId })}
              />
            </div>
          )}

          {currentTab === 'rejected' && (
            <div className="space-y-4">
              <PaymentTable
                payments={payments}
                filterStatus="REJECTED"
                onViewPayment={(p) => setSelectedPayment(p)}
                onOpenStatusModal={handleOpenStatusModal}
                onOpenAmountModal={(p) => setAmountModalPayment(p)}
                onViewScreenshot={(fileId, paymentId) => setViewerScreenshot({ fileId, paymentId })}
              />
            </div>
          )}

          {currentTab === 'fake' && (
            <div className="space-y-4">
              <PaymentTable
                payments={payments}
                filterStatus="FAKE"
                onViewPayment={(p) => setSelectedPayment(p)}
                onOpenStatusModal={handleOpenStatusModal}
                onOpenAmountModal={(p) => setAmountModalPayment(p)}
                onViewScreenshot={(fileId, paymentId) => setViewerScreenshot({ fileId, paymentId })}
              />
            </div>
          )}

          {currentTab === 'users' && (
            <UserTable
              users={users}
              onSelectUser={(u) => setSelectedUser(u)}
            />
          )}

          {currentTab === 'daily-reports' && (
            <DailyReportView
              payments={payments}
              onSelectPayment={(p) => setSelectedPayment(p)}
            />
          )}

          {currentTab === '15day-reports' && (
            <FifteenDayReportView
              payments={payments}
              onSelectPayment={(p) => setSelectedPayment(p)}
            />
          )}

          {currentTab === 'monthly-reports' && (
            <MonthlyReportView
              payments={payments}
              onSelectPayment={(p) => setSelectedPayment(p)}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityPage />
          )}

          {currentTab === 'lookup' && (
            <UserLookupPage onBackToDashboard={() => setCurrentTab('dashboard')} />
          )}

          {currentTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onOpenStatusModal={handleOpenStatusModal}
          onOpenAmountModal={(p) => setAmountModalPayment(p)}
          onSaveNotes={handleSaveNotes}
          onRetrySync={handleRetryTelegramSync}
          onViewScreenshot={(fileId, paymentId) => setViewerScreenshot({ fileId, paymentId })}
        />
      )}

      {statusModalPayment && (
        <StatusActionModal
          payment={statusModalPayment}
          targetStatus={targetStatus}
          onConfirm={handleConfirmStatusChange}
          onClose={() => setStatusModalPayment(null)}
        />
      )}

      {amountModalPayment && (
        <AmountEditModal
          payment={amountModalPayment}
          onSave={handleConfirmAmountEdit}
          onClose={() => setAmountModalPayment(null)}
        />
      )}

      {viewerScreenshot && (
        <ScreenshotViewerModal
          fileId={viewerScreenshot.fileId}
          paymentId={viewerScreenshot.paymentId}
          onClose={() => setViewerScreenshot(null)}
        />
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSelectPayment={(p) => setSelectedPayment(p)}
        />
      )}
    </div>
  );
}
