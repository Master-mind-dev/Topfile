import React, { useState, useEffect } from 'react';
import { Shield, Download, Smartphone, Laptop, Check, Copy } from 'lucide-react';
import { OwnlyAdminLogo } from './AdminPanel';

interface AdminInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
}

export function AdminInstallModal({ isOpen, onClose, deferredPrompt }: AdminInstallModalProps) {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copied, setCopied] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform('ios');
    else if (/Android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');
  }, []);

  if (!isOpen) return null;

  const adminUrl = 'https://topfile.onrender.com/admin';

  const handleInstallNow = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      onClose();
    } else {
      if (platform === 'ios') {
        alert("On iPhone/iPad: Tap Safari's Share button at the bottom and choose 'Add to Home Screen'.");
      } else {
        alert("In your browser menu (⋮), tap 'Install app' or 'Add to Home screen'.");
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(adminUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-white/10 rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 text-center border-b border-white/10 relative bg-gradient-to-b from-[#d9ad52]/10 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
          <div className="mb-3 flex justify-center">
            <OwnlyAdminLogo size={64} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d9ad52]/15 border border-[#d9ad52]/30 text-[#d9ad52] text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" /> Standalone App
          </div>
          <h2 className="text-xl font-black text-white font-['Outfit']">Install OWNLY Admin App</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Install the Admin Portal onto your phone's home screen with the official logo
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 p-3 bg-zinc-900/50 border-b border-white/5">
          <button
            onClick={() => setPlatform('android')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              platform === 'android' ? 'bg-[#d9ad52] text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Android
          </button>
          <button
            onClick={() => setPlatform('ios')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              platform === 'ios' ? 'bg-[#d9ad52] text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> iOS (iPhone)
          </button>
          <button
            onClick={() => setPlatform('desktop')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              platform === 'desktop' ? 'bg-[#d9ad52] text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" /> PC / Mac
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <button
            onClick={handleInstallNow}
            className="w-full py-3.5 bg-[#d9ad52] hover:bg-[#f4dfb0] text-[#111] font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d9ad52]/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> {installed ? 'App Installed!' : 'Install Admin App to Device'}
          </button>

          {platform === 'android' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2 text-zinc-300">
              <div className="font-bold text-white mb-1">Android Installation Steps:</div>
              <p>1. Open <strong className="text-[#d9ad52]">Chrome</strong> or <strong className="text-[#d9ad52]">Brave</strong></p>
              <p>2. Tap the three dots menu (<strong className="text-white">⋮</strong>) at top-right</p>
              <p>3. Tap <strong className="text-[#d9ad52]">"Install app"</strong> or <strong className="text-[#d9ad52]">"Add to Home screen"</strong></p>
              <p className="text-[11px] text-zinc-400 mt-2">The OWNLY Admin icon will appear directly on your home screen!</p>
            </div>
          )}

          {platform === 'ios' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2 text-zinc-300">
              <div className="font-bold text-white mb-1">iPhone / iPad Steps:</div>
              <p>1. Open this page in <strong className="text-[#d9ad52]">Safari</strong></p>
              <p>2. Tap the <strong className="text-[#d9ad52]">Share button</strong> (square with arrow ↑) at the bottom</p>
              <p>3. Scroll down and tap <strong className="text-[#d9ad52]">"Add to Home Screen" ➕</strong></p>
              <p>4. Tap <strong className="text-white">Add</strong> in top-right</p>
            </div>
          )}

          {platform === 'desktop' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2 text-zinc-300">
              <div className="font-bold text-white mb-1">Desktop Chrome / Edge:</div>
              <p>1. Click the <strong className="text-[#d9ad52]">Install</strong> icon in the browser address bar (top right)</p>
              <p>2. Or click Menu (<strong className="text-white">⋮</strong>) → <strong className="text-[#d9ad52]">Save and Share</strong> → <strong className="text-[#d9ad52]">Install page as app</strong></p>
            </div>
          )}

          {/* Copy URL */}
          <div className="pt-2">
            <div className="text-[11px] text-zinc-400 mb-1 font-semibold">Direct Admin Link:</div>
            <div className="flex gap-2 items-center bg-black/60 border border-white/10 rounded-xl p-2 px-3">
              <input
                type="text"
                readOnly
                value={adminUrl}
                className="bg-transparent border-none text-xs text-zinc-300 flex-1 outline-none font-mono"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-[#d9ad52]/20 hover:bg-[#d9ad52]/30 text-[#d9ad52] border border-[#d9ad52]/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
