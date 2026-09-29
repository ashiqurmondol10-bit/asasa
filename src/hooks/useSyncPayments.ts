import { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { paymentService } from '../db/paymentService';

export function useSyncPayments(pollIntervalMs = 4000) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newArrivalsNotification, setNewArrivalsNotification] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const performSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);
      const pending = await apiClient.syncPendingPayments();

      if (pending && pending.length > 0) {
        const ackIds: string[] = [];
        let newCount = 0;

        for (const item of pending) {
          const res = await paymentService.ingestPayment(item);
          ackIds.push(item.id);
          if (!res.isDuplicate) {
            newCount++;
          }
        }

        if (ackIds.length > 0) {
          await apiClient.acknowledgePayments(ackIds);
        }

        if (newCount > 0 && isMountedRef.current) {
          setNewArrivalsNotification(
            `⚡ ${newCount} new payment${newCount > 1 ? 's' : ''} received via Telegram!`
          );
        }
      }

      if (isMountedRef.current) {
        setLastSyncTime(new Date());
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    performSync(); // Initial sync on mount

    const interval = setInterval(() => {
      performSync();
    }, pollIntervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [performSync, pollIntervalMs]);

  const clearNotification = () => setNewArrivalsNotification(null);

  return {
    isSyncing,
    lastSyncTime,
    error,
    newArrivalsNotification,
    clearNotification,
    triggerSync: performSync,
  };
}
