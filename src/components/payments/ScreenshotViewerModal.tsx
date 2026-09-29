import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ScreenshotViewerModalProps {
  fileId: string;
  paymentId: string;
  onClose: () => void;
}

export const ScreenshotViewerModal: React.FC<ScreenshotViewerModalProps> = ({
  fileId,
  paymentId,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const imageUrl = apiClient.getTelegramImageProxyUrl(fileId);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setScale(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
          <div>
            <h3 className="text-base font-semibold text-white">Payment Screenshot</h3>
            <p className="text-xs text-slate-400 font-mono">{paymentId} · File ID: {fileId.slice(0, 16)}...</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1 text-slate-300">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono">{Math.round(scale * 100)}%</span>
              <button
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded cursor-pointer ml-1"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Raw</span>
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/80">
          <img
            src={imageUrl}
            alt={`Payment ${paymentId} screenshot`}
            style={{ transform: `scale(${scale})`, transition: 'transform 0.15s ease-out' }}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl origin-center"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
