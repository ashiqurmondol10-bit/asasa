import React, { useState, useEffect } from 'react';
import {
  Bot,
  Globe,
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Zap,
  Download,
  Upload,
  Database,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { apiClient, type BotInfoResponse } from '../services/apiClient';
import { db } from '../db/dexie';

export const SettingsPage: React.FC = () => {
  const [botInfo, setBotInfo] = useState<BotInfoResponse | null>(null);
  const [checkingBot, setCheckingBot] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Simulation form
  const [simUserId, setSimUserId] = useState('78192031');
  const [simUsername, setSimUsername] = useState('crypto_trader');
  const [simFirstName, setSimFirstName] = useState('Elena');
  const [simLastName, setSimLastName] = useState('Rostova');
  const [simCaption, setSimCaption] = useState('Sent payment $150.00 USD for invoice #4092');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Export / Import
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  const checkConnection = async () => {
    setCheckingBot(true);
    try {
      const data = await apiClient.checkBotStatus();
      setBotInfo(data);
    } finally {
      setCheckingBot(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // Default webhook URL from window.location
    if (typeof window !== 'undefined') {
      const defaultUrl = `${window.location.origin}/api/telegram/webhook`;
      setWebhookUrlInput(defaultUrl);
    }
  }, []);

  const handleRegisterWebhook = async () => {
    if (!webhookUrlInput.trim()) return;
    setSettingWebhook(true);
    setWebhookFeedback(null);
    try {
      const res = await apiClient.setWebhook(webhookUrlInput.trim());
      if (res.ok) {
        setWebhookFeedback('✅ Webhook successfully registered with Telegram!');
        checkConnection();
      } else {
        setWebhookFeedback(`❌ Failed: ${res.description || 'Unknown error'}`);
      }
    } catch (err: unknown) {
      setWebhookFeedback(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSettingWebhook(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await apiClient.simulateInboundPayment({
        userId: simUserId,
        username: simUsername,
        firstName: simFirstName,
        lastName: simLastName,
        caption: simCaption,
      });

      if (res.ok) {
        setSimResult(`✅ Inbound payment simulated! Payment ID: ${res.paymentId} (Detected: $${res.detectedAmount || 0})`);
      } else {
        setSimResult('❌ Simulation failed');
      }
    } catch (err: unknown) {
      setSimResult(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrlInput);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleExportBackup = async () => {
    try {
      const payments = await db.payments.toArray();
      const users = await db.users.toArray();
      const statusHistory = await db.statusHistory.toArray();
      const activityLogs = await db.activityLogs.toArray();

      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        payments,
        users,
        statusHistory,
        activityLogs,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telepay_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupFeedback('✅ Database backup exported successfully');
      setTimeout(() => setBackupFeedback(null), 3000);
    } catch (err) {
      setBackupFeedback('❌ Backup failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Bot Status & Environment Variables Guidance */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-400 border border-sky-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Telegram Bot API Integration</h3>
              <p className="text-xs text-slate-400">Secure serverless communication with Telegram</p>
            </div>
          </div>
          <button
            onClick={checkConnection}
            disabled={checkingBot}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingBot ? 'animate-spin' : ''}`} />
            <span>Check Bot</span>
          </button>
        </div>

        {/* Live Bot Connection Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Connection Status</span>
            {botInfo?.configured ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Bot (@{botInfo.bot?.username || 'Verified'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                Awaiting TELEGRAM_BOT_TOKEN
              </span>
            )}
          </div>

          {botInfo?.bot && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Bot Name:</span>
                <p className="font-semibold text-slate-200">{botInfo.bot.firstName}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Username:</span>
                <p className="font-mono text-sky-400">@{botInfo.bot.username}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Bot ID:</span>
                <p className="font-mono text-slate-300">{botInfo.bot.id}</p>
              </div>
            </div>
          )}

          {botInfo?.webhookInfo?.url && (
            <div className="mt-2 text-[11px] text-slate-400 font-mono">
              Current Registered Webhook: <span className="text-sky-300">{botInfo.webhookInfo.url}</span>
            </div>
          )}
        </div>

        {/* Security Rule Card */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-sky-400" />
            Security & Zero-Exposure Architecture
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Telegram Bot Token never appears inside React frontend source code, browser localStorage, or Git commits.
            All Telegram operations (streaming images, webhook validation, and public status replies) run exclusively on serverless API routes.
          </p>
          <div className="mt-2 rounded-lg bg-slate-950/90 p-3 font-mono text-[11px] text-slate-300 space-y-1">
            <p className="text-slate-500"># Set inside Vercel Dashboard → Settings → Environment Variables:</p>
            <p><span className="text-sky-400">TELEGRAM_BOT_TOKEN</span>=your_bot_token_from_botfather</p>
            <p><span className="text-sky-400">TELEGRAM_WEBHOOK_SECRET</span>=optional_secret_token</p>
          </div>
        </div>
      </div>

      {/* Webhook Setup Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 border border-indigo-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Telegram Webhook Configuration</h3>
            <p className="text-xs text-slate-400">Point your Telegram bot to this application endpoint</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-300">
            Webhook Destination URL (POST /api/telegram/webhook)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={webhookUrlInput}
              onChange={(e) => setWebhookUrlInput(e.target.value)}
              placeholder="https://your-domain.vercel.app/api/telegram/webhook"
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
            />
            <button
              onClick={handleCopyWebhookUrl}
              className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy URL"
            >
              {copiedWebhook ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleRegisterWebhook}
              disabled={settingWebhook || !botInfo?.configured}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 cursor-pointer shadow-md shadow-indigo-600/20 whitespace-nowrap"
            >
              {settingWebhook ? 'Registering...' : 'Register Webhook'}
            </button>
          </div>

          {webhookFeedback && (
            <p className="text-xs font-mono text-slate-300 pt-1">{webhookFeedback}</p>
          )}

          <p className="text-[11px] text-slate-500">
            Once registered, every photo or screenshot sent to your Telegram bot will instantly trigger this webhook and appear in your dashboard.
          </p>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Simulate Inbound Telegram Webhook</h3>
            <p className="text-xs text-slate-400">Test the complete receipt ingestion pipeline without waiting for live Telegram users</p>
          </div>
        </div>

        <form onSubmit={handleSimulateWebhook} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Telegram User ID</label>
              <input
                type="text"
                value={simUserId}
                onChange={(e) => setSimUserId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Telegram Username</label>
              <input
                type="text"
                value={simUsername}
                onChange={(e) => setSimUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={simFirstName}
                onChange={(e) => setSimFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={simLastName}
                onChange={(e) => setSimLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Receipt Caption (Amount Auto-Detection Test)
            </label>
            <input
              type="text"
              value={simCaption}
              onChange={(e) => setSimCaption(e.target.value)}
              placeholder="e.g. Payment $150.00 USD"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono"
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">
              The system parses amounts from captions like "$100", "100 USD", "Sent 75.50 EUR".
            </p>
          </div>

          {simResult && (
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-sky-400">
              {simResult}
            </div>
          )}

          <button
            type="submit"
            disabled={simulating}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-amber-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{simulating ? 'Simulating Inbound Payment...' : 'Send Simulated Webhook Receipt'}</span>
          </button>
        </form>
      </div>

      {/* Database Backup Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Local Dexie Database Management</h3>
            <p className="text-xs text-slate-400">IndexedDB storage and backup utilities</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-slate-300">Export Full IndexedDB Snapshot (JSON)</p>
            <p className="text-[11px] text-slate-500">
              Downloads all payments, users, status history, and activity logs.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Database JSON</span>
          </button>
        </div>

        {backupFeedback && (
          <p className="text-xs font-mono text-emerald-400">{backupFeedback}</p>
        )}
      </div>
    </div>
  );
};
