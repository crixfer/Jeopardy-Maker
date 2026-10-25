import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Copy, Check, X, QrCode, ExternalLink, Sparkles } from 'lucide-react';

interface JoinQRCodeProps {
  pin: string;
  gameTitle?: string;
  onClose?: () => void;
  isInline?: boolean;
}

export const JoinQRCode: React.FC<JoinQRCodeProps> = ({
  pin,
  gameTitle,
  onClose,
  isInline = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Generate direct join link with query parameter
  const getJoinUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?pin=${pin}`;
  };

  const joinUrl = getJoinUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const content = (
    <div className="flex flex-col items-center text-center space-y-4">
      {/* Title & Instructions */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase tracking-wider">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Student Phone Buzzer Join</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white">
          Scan to Play on Mobile
        </h3>
        <p className="text-xs text-slate-300 max-w-sm">
          Point your phone camera at this QR code to instantly open your team buzzer controller.
        </p>
      </div>

      {/* High-Contrast QR Code Card */}
      <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-indigo-500/40 flex flex-col items-center justify-center">
        <QRCodeSVG
          value={joinUrl}
          size={200}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%234f46e5"/><text x="50" y="66" font-size="48" font-family="sans-serif" font-weight="900" text-anchor="middle" fill="%23fbbf24">J!</text></svg>',
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
        <div className="mt-1 text-[11px] font-bold text-slate-600 tracking-wider uppercase">
          Scan with Camera App
        </div>
      </div>

      {/* Big Room PIN Display */}
      <div className="w-full bg-slate-950/80 border-2 border-indigo-500/40 rounded-2xl p-3.5 flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Or Enter PIN Manually
        </span>
        <div className="font-mono text-3xl sm:text-4xl font-black text-amber-400 tracking-widest my-1 select-all">
          {pin}
        </div>
        <div className="text-[11px] text-slate-400">
          Go to <strong className="text-white underline">{typeof window !== 'undefined' ? window.location.host : ''}</strong> and select <strong>Student Buzzer</strong>
        </div>
      </div>

      {/* Copy Direct URL */}
      <div className="flex gap-2 w-full">
        <button
          onClick={handleCopyLink}
          className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md active:scale-95"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Direct Join Link'}</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-slate-900 border-2 border-indigo-600/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {content}
      </div>
    </div>
  );
};
