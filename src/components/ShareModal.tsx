import React, { useState } from 'react';
import { shareFileNative, shareToWhatsAppDirect, resolveFileUri, urlToFile, type ShareableItem } from '../lib/shareHelper';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ShareableItem | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, file }) => {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen || !file) return null;

  async function handleNativeShare() {
    if (!file) return;
    setSharing(true);
    setStatusMsg('Opening share sheet…');
    const res = await shareFileNative(file);
    setSharing(false);
    if (res.success) {
      onClose();
    } else if (res.cancelled) {
      setStatusMsg('');
    } else {
      setStatusMsg(res.error || 'System share not supported. Use WhatsApp or Download below.');
    }
  }

  async function handleWhatsApp() {
    if (!file) return;
    setSharing(true);
    // On Android/Capacitor, first try native file share so WhatsApp actually gets the image/file attached!
    const res = await shareFileNative(file);
    setSharing(false);
    if (!res.success && !res.cancelled) {
      // If native sharing fails (e.g. desktop web browser), open WhatsApp link directly
      shareToWhatsAppDirect(file);
    }
  }

  async function handleDownload() {
    if (!file) return;
    try {
      const uri = await resolveFileUri(file);
      const a = document.createElement('a');
      a.href = uri;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatusMsg('Download started!');
      setTimeout(() => setStatusMsg(''), 2000);
    } catch {
      setStatusMsg('Download failed');
    }
  }

  async function handleCopy() {
    if (!file) return;
    try {
      const uri = await resolveFileUri(file);
      if (navigator.clipboard) {
        if (uri.startsWith('http')) {
          await navigator.clipboard.writeText(uri);
        } else {
          await navigator.clipboard.writeText(file.name);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 0 max(16px, env(safe-area-inset-bottom)) 0',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-card, #18181b)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
          padding: '20px 20px 24px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          color: 'var(--text-primary, #ffffff)',
          animation: 'slideUp 0.25s ease-out',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 16px' }} />

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: 'Manrope,sans-serif' }}>Share File</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary, rgba(255,255,255,0.6))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
              {file.name} {file.size ? `• ${file.size}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {statusMsg && (
          <div style={{ padding: '8px 12px', background: 'rgba(225,29,72,0.15)', color: '#fb7185', borderRadius: 10, fontSize: 12, marginBottom: 14 }}>
            {statusMsg}
          </div>
        )}

        {/* Share Action Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {/* WhatsApp Direct */}
          <button
            onClick={handleWhatsApp}
            disabled={sharing}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 10px',
              borderRadius: 16,
              background: 'rgba(37,211,102,0.15)',
              border: '1px solid rgba(37,211,102,0.3)',
              color: '#25d366',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'Manrope,sans-serif',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.185 8.185 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.187 8.187 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.13-.17.25-.65.8-.8 1-.15.15-.3.17-.55.05-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z"/>
              </svg>
            </div>
            <span>WhatsApp</span>
          </button>

          {/* All Apps / System Share */}
          <button
            onClick={handleNativeShare}
            disabled={sharing}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 10px',
              borderRadius: 16,
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60a5fa',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'Manrope,sans-serif',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <span>More Apps</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 10px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
              color: 'var(--text-primary, #fff)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'Manrope,sans-serif',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <span>Download</span>
          </button>
        </div>

        {/* Copy Link / Name Button */}
        <button
          onClick={handleCopy}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 14,
            border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
            background: 'var(--bg-chip, rgba(255,255,255,0.06))',
            color: 'var(--text-primary, #fff)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? '✓ Copied!' : 'Copy File Info'}
        </button>
      </div>
    </div>
  );
};
export default ShareModal;
