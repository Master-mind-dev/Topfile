import { useState, useEffect } from "react";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop">("android");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Detect OS
    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform("ios");
    } else if (/Android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Check if running as standalone PWA
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const appUrl = "https://topfile.onrender.com";
  const ghPagesUrl = "https://master-mind-dev.github.io/Topfile/";

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        platform === "ios"
          ? "On iOS: Tap the Share button in Safari and select 'Add to Home Screen'."
          : "Tap your browser's menu (⋮) and tap 'Install app' or 'Add to Home screen'."
      );
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--bg-card, #121214)",
          color: "var(--text-primary, #ffffff)",
          borderRadius: 24,
          border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
          overflow: "hidden",
          animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Brand */}
        <div
          style={{
            padding: "24px 20px 16px",
            background: "linear-gradient(180deg, rgba(159, 18, 57, 0.18) 0%, transparent 100%)",
            borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
            textAlign: "center",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              color: "var(--text-secondary, #94a3b8)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            ✕
          </button>

          {/* App Icon */}
          <div style={{ display: "inline-block", position: "relative", marginBottom: 12 }}>
            <img
              src="/icons/icon-192.png"
              onError={(e) => {
                // Fallback to SVG if png not loaded
                (e.target as HTMLImageElement).src = "/icons/icon-192.svg";
              }}
              alt="OWNLY App Icon"
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                boxShadow: "0 8px 24px rgba(225, 29, 72, 0.35)",
                display: "block",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                background: "#10b981",
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid #121214",
              }}
            />
          </div>

          <h2
            style={{
              margin: "0 0 4px",
              fontFamily: "Manrope, sans-serif",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: -0.4,
            }}
          >
            Download OWNLY
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--text-secondary, #94a3b8)",
            }}
          >
            Edge-to-edge mobile app for Android & iOS
          </p>
        </div>

        {/* Platform Selector Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            padding: "12px 16px 0",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setPlatform("android")}
            style={{
              padding: "9px 0",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontFamily: "Manrope, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: platform === "android" ? "#9f1239" : "rgba(255,255,255,0.06)",
              color: platform === "android" ? "#ffffff" : "var(--text-secondary, #94a3b8)",
              transition: "all 0.2s",
            }}
          >
            <span>🤖</span> Android
          </button>
          <button
            type="button"
            onClick={() => setPlatform("ios")}
            style={{
              padding: "9px 0",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontFamily: "Manrope, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: platform === "ios" ? "#9f1239" : "rgba(255,255,255,0.06)",
              color: platform === "ios" ? "#ffffff" : "var(--text-secondary, #94a3b8)",
              transition: "all 0.2s",
            }}
          >
            <span>🍏</span> iOS (iPhone)
          </button>
          <button
            type="button"
            onClick={() => setPlatform("desktop")}
            style={{
              padding: "9px 0",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontFamily: "Manrope, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: platform === "desktop" ? "#9f1239" : "rgba(255,255,255,0.06)",
              color: platform === "desktop" ? "#ffffff" : "var(--text-secondary, #94a3b8)",
              transition: "all 0.2s",
            }}
          >
            <span>💻</span> Web / Desktop
          </button>
        </div>

        {/* Content based on platform */}
        <div style={{ padding: "16px 20px 24px" }}>
          {platform === "android" && (
            <div>
              {/* Native install trigger button if prompt ready */}
              <button
                type="button"
                onClick={handleNativeInstall}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #e11d48 0%, #9f1239 100%)",
                  color: "#ffffff",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(225, 29, 72, 0.4)",
                  marginBottom: 16,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isInstalled ? "App Installed" : "Install App to Android"}
              </button>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--text-primary, #fff)" }}>
                  How to install on Android Chrome:
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: "#e11d48", fontWeight: 800 }}>1.</span>
                  <span>Open this link in <strong>Google Chrome</strong> or <strong>Brave</strong></span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: "#e11d48", fontWeight: 800 }}>2.</span>
                  <span>Tap the <strong>three dots (⋮)</strong> at top right</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#e11d48", fontWeight: 800 }}>3.</span>
                  <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                </div>
              </div>
            </div>
          )}

          {platform === "ios" && (
            <div>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                  borderRadius: 14,
                  padding: "14px 16px",
                  fontSize: 12,
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: "var(--text-primary, #fff)" }}>
                  How to install on iPhone & iPad:
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                  <span style={{ background: "#9f1239", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>1</span>
                  <span>Open <strong>Safari</strong> and navigate to this link</span>
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                  <span style={{ background: "#9f1239", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>2</span>
                  <span>
                    Tap the <strong>Share button</strong>{" "}
                    <svg style={{ display: "inline-block", verticalAlign: "middle" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>{" "}
                    at the bottom
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ background: "#9f1239", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>3</span>
                  <span>Scroll down & tap <strong>"Add to Home Screen" ➕</strong></span>
                </div>
              </div>
            </div>
          )}

          {platform === "desktop" && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 12,
                  lineHeight: 1.6,
                  marginBottom: 12,
                }}
              >
                In <strong>Chrome</strong> or <strong>Edge</strong>, click the <strong>Install</strong> icon in the address bar (or Menu → Install OWNLY) to install as a native desktop window.
              </div>
            </div>
          )}

          {/* Quick links & copy link */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", marginBottom: 6, fontWeight: 600 }}>
              Direct App Download & Launch Links:
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "rgba(0,0,0,0.25)",
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              }}
            >
              <input
                readOnly
                value={appUrl}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary, #fff)",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  padding: "6px 12px",
                  background: copied ? "#10b981" : "#9f1239",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "space-between" }}>
              <a
                href={appUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 11,
                  color: "#e11d48",
                  textDecoration: "none",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Open Live Web App ↗
              </a>
              <a
                href={ghPagesUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary, #94a3b8)",
                  textDecoration: "none",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                GitHub Pages ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
