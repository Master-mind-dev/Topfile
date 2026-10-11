import React, { useState, useRef, useEffect, useCallback, ChangeEvent } from "react";
import jsPDF from "jspdf";
import { Camera, RefreshCw, X, Image as ImageIcon, Check, Sliders, FileText, Download, Trash2, Plus } from "lucide-react";

export interface ScannedPage {
  id: string;
  uri: string;
  enhanced?: string;
  mode: EnhanceMode;
}
type EnhanceMode = "original" | "auto" | "color" | "grayscale" | "bw";
type Phase = "camera" | "enhance" | "pages" | "ocr";

// ─── Canvas enhancement filter ────────────────────────────────────────────────
function applyFilter(src: string, mode: EnhanceMode): Promise<string> {
  return new Promise((resolve) => {
    if (mode === "original") {
      resolve(src);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i],
          g = px[i + 1],
          b = px[i + 2];
        if (mode === "grayscale" || mode === "bw" || mode === "auto") {
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          if (mode === "bw") {
            const bw = gray > 128 ? 255 : 0;
            px[i] = px[i + 1] = px[i + 2] = bw;
          } else if (mode === "grayscale") {
            px[i] = px[i + 1] = px[i + 2] = gray;
          } else {
            // auto — boost contrast
            const v = Math.min(255, Math.max(0, (gray - 100) * 1.5 + 100));
            px[i] = px[i + 1] = px[i + 2] = v;
          }
        } else if (mode === "color") {
          const avg = (r + g + b) / 3;
          px[i] = Math.min(255, avg + (r - avg) * 1.4);
          px[i + 1] = Math.min(255, avg + (g - avg) * 1.4);
          px[i + 2] = Math.min(255, avg + (b - avg) * 1.4);
        }
      }
      ctx.putImageData(d, 0, 0);
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// ─── OCR via Tesseract ────────────────────────────────────────────────────────
async function runOCR(uri: string): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const w = await createWorker("eng");
    const { data } = await w.recognize(uri);
    await w.terminate();
    return data.text.trim();
  } catch {
    return "";
  }
}

export default function Scanner({
  onBack,
  onInsertToNote,
}: {
  onBack(): void;
  onInsertToNote(pages: ScannedPage[], pdfUri?: string): void;
}) {
  const [phase, setPhase] = useState<Phase>("camera");
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<EnhanceMode>("auto");
  const [pdfName, setPdfName] = useState("Scanned_Document");
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);

  // Live Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [flash, setFlash] = useState(false);

  const uid = () => `p${Date.now()}${Math.random().toString(36).slice(2)}`;
  const activePage = pages.find((p) => p.id === activeId) || pages[pages.length - 1] || null;

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, [stream]);

  // Start real live camera via getUserMedia
  const startCamera = useCallback(
    async (targetFacing: "user" | "environment") => {
      setCameraError("");
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }

      // Check if mediaDevices exists or polyfill legacy
      const getUM =
        navigator?.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ||
        (navigator as any)?.getUserMedia?.bind(navigator) ||
        (navigator as any)?.webkitGetUserMedia?.bind(navigator) ||
        (navigator as any)?.mozGetUserMedia?.bind(navigator);

      // Check secure context
      const isSecure = window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

      if (!getUM || !isSecure) {
        if (!isSecure) {
          setCameraError(
            "Live video stream requires HTTPS. On plain HTTP or local network IP, browsers block getUserMedia. Tap 'Take Photo' to use your device camera directly."
          );
        } else {
          setCameraError(
            "Live camera stream is not supported in this browser environment. Tap 'Take Photo' to open your camera."
          );
        }
        return;
      }

      try {
        let newStream: MediaStream;
        try {
          // Attempt ideal resolution
          newStream = await getUM({
            video: {
              facingMode: { ideal: targetFacing },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch {
          // Fallback to basic video constraint if ideal failed
          newStream = await getUM({
            video: true,
            audio: false,
          });
        }

        setStream(newStream);
        setFacingMode(targetFacing);
        setIsCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn("Camera access failed:", err);
        setIsCameraActive(false);
        setCameraError(
          err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
            ? "Camera permission was denied. Tap 'Take Photo' or allow camera in browser address bar."
            : "Could not initialize live stream. Tap 'Take Photo' below to snap a picture."
        );
      }
    },
    [stream]
  );

  // Initialize camera when entering camera phase
  useEffect(() => {
    if (phase === "camera") {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Live Shutter Click: snapshot frame from video canvas
  const handleShutterCapture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.94);

    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    const id = uid();
    const enhanced = await applyFilter(dataUrl, "auto");
    const newPage: ScannedPage = { id, uri: dataUrl, enhanced, mode: "auto" };

    setPages((prev) => [...prev, newPage]);
    setActiveId(id);
    stopCamera();
    setPhase("enhance");
  };

  // Gallery fallback upload
  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const uri = URL.createObjectURL(f);
      const id = uid();
      const enhanced = await applyFilter(uri, "auto");
      const page: ScannedPage = { id, uri, enhanced, mode: "auto" };
      setPages((prev) => [...prev, page]);
      setActiveId(id);
    }

    e.target.value = "";
    stopCamera();
    setPhase("enhance");
  };

  // Mode enhancement change
  async function applyMode(m: EnhanceMode) {
    setMode(m);
    if (!activePage) return;
    const result = await applyFilter(activePage.uri, m);
    setPages((prev) => prev.map((p) => (p.id === activePage.id ? { ...p, mode: m, enhanced: result } : p)));
  }

  // Build PDF from all captured pages
  async function buildPDF(): Promise<string> {
    const doc = new jsPDF({ unit: "px", compress: true });
    let first = true;
    for (const page of pages) {
      const src = page.enhanced || page.uri;
      if (!first) doc.addPage();
      first = false;
      const img = new Image();
      img.src = src;
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const ratio = Math.min(W / img.naturalWidth, H / img.naturalHeight);
      const w = img.naturalWidth * ratio,
        h = img.naturalHeight * ratio;
      const x = (W - w) / 2,
        y = (H - h) / 2;
      doc.addImage(src, "JPEG", x, y, w, h, undefined, "FAST");
    }
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }

  // OCR on all pages
  async function doOCR() {
    setOcrLoading(true);
    setOcrText("");
    let combined = "";
    for (let i = 0; i < pages.length; i++) {
      const src = pages[i].enhanced || pages[i].uri;
      const text = await runOCR(src);
      combined += `--- Page ${i + 1} ---\n${text}\n\n`;
    }
    setOcrText(combined.trim());
    setOcrLoading(false);
    setPhase("ocr");
  }

  const MODES: { key: EnhanceMode; label: string }[] = [
    { key: "original", label: "Original" },
    { key: "auto", label: "Auto" },
    { key: "color", label: "Color" },
    { key: "grayscale", label: "Grayscale" },
    { key: "bw", label: "B&W" },
  ];

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. LIVE CAMERA VIEWFINDER PHASE
  // ═════════════════════════════════════════════════════════════════════════════
  if (phase === "camera") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 500,
          background: "#000000",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Top Control Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            padding: "calc(env(safe-area-inset-top) + 12px) 18px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
          }}
        >
          <button
            onClick={() => {
              stopCamera();
              onBack();
            }}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%",
              width: 40,
              height: 40,
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>

          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isCameraActive ? "#10b981" : "#f59e0b",
                display: "inline-block",
              }}
            />
            {isCameraActive ? "Scanner Ready" : "Initializing…"}
          </div>

          <button
            onClick={() => startCamera(facingMode === "environment" ? "user" : "environment")}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%",
              width: 40,
              height: 40,
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Flip Camera"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Live Video Viewfinder */}
        <div style={{ flex: 1, position: "relative", width: "100%", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Flash screen pulse */}
          {flash && (
            <div style={{ position: "absolute", inset: 0, background: "#ffffff", zIndex: 60, pointerEvents: "none" }} />
          )}

          {/* Document Framing Guidelines */}
          {isCameraActive && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "82%",
                  maxWidth: 420,
                  aspectRatio: "3 / 4",
                  position: "relative",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.35)",
                  borderRadius: 14,
                  border: "2px solid rgba(255,255,255,0.4)",
                }}
              >
                {/* 4 Corner Markers */}
                <div style={{ position: "absolute", top: -2, left: -2, width: 24, height: 24, borderTop: "4px solid #e11d48", borderLeft: "4px solid #e11d48", borderTopLeftRadius: 10 }} />
                <div style={{ position: "absolute", top: -2, right: -2, width: 24, height: 24, borderTop: "4px solid #e11d48", borderRight: "4px solid #e11d48", borderTopRightRadius: 10 }} />
                <div style={{ position: "absolute", bottom: -2, left: -2, width: 24, height: 24, borderBottom: "4px solid #e11d48", borderLeft: "4px solid #e11d48", borderBottomLeftRadius: 10 }} />
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderBottom: "4px solid #e11d48", borderRight: "4px solid #e11d48", borderBottomRightRadius: 10 }} />
              </div>
            </div>
          )}

          {/* Camera Error / Permission Fallback */}
          {cameraError && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                textAlign: "center",
                zIndex: 30,
              }}
            >
              <Camera size={48} color="#e11d48" style={{ marginBottom: 16 }} />
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>Camera Permission Needed</h3>
              <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.7)", fontSize: 13, maxWidth: 300 }}>
                {cameraError}
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  onClick={() => directCameraInputRef.current?.click()}
                  style={{
                    padding: "12px 22px",
                    borderRadius: 14,
                    background: "#e11d48",
                    color: "#fff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 6px 20px rgba(225,29,72,0.4)",
                  }}
                >
                  <Camera size={18} /> Take Photo Now
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Pick from Gallery
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden direct camera input (works on all devices, HTTP & HTTPS) */}
        <input
          ref={directCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleGalleryUpload}
        />

        {/* Bottom Shutter & Controls */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            padding: "20px 24px calc(env(safe-area-inset-bottom) + 20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
          }}
        >
          {/* Gallery Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Upload from Gallery"
          >
            <ImageIcon size={22} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleGalleryUpload}
          />

          {/* Large Shutter Button */}
          <button
            onClick={() => {
              if (isCameraActive) {
                handleShutterCapture();
              } else {
                directCameraInputRef.current?.click();
              }
            }}
            style={{
              width: 78,
              height: 78,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              border: "4px solid #ffffff",
              boxShadow: "0 6px 30px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.1s ease",
            }}
            title="Capture Document"
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#ffffff",
              }}
            />
          </button>

          {/* Queued Pages Preview Button */}
          <button
            onClick={() => {
              if (pages.length > 0) {
                stopCamera();
                setPhase("pages");
              }
            }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              background: pages.length > 0 ? "#e11d48" : "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              cursor: pages.length > 0 ? "pointer" : "default",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
            }}
            title="View scanned pages"
          >
            <span>{pages.length}</span>
            <span style={{ fontSize: 9, opacity: 0.8 }}>PAGES</span>
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. ENHANCE / FILTER PREVIEW PHASE
  // ═════════════════════════════════════════════════════════════════════════════
  if (phase === "enhance" && activePage) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", color: "#fff", display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "rgba(18,18,24,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => setPhase("camera")} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 4 }}>
            <X size={20} />
          </button>
          <span style={{ flex: 1, fontFamily: "Manrope,sans-serif", fontSize: 16, fontWeight: 800 }}>Enhance Scan</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Page {pages.length}</span>
        </header>

        {/* Preview image */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <img
            src={activePage.enhanced || activePage.uri}
            alt=""
            style={{ maxWidth: "100%", maxHeight: "62vh", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.6)", objectFit: "contain" }}
          />
        </div>

        {/* Enhancement modes */}
        <div style={{ padding: "0 16px 14px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
            Document Preset
          </p>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => applyMode(m.key)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 20,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  background: mode === m.key ? "#e11d48" : "rgba(255,255,255,0.12)",
                  color: mode === m.key ? "#fff" : "rgba(255,255,255,0.8)",
                  transition: "all 0.15s",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ padding: "0 16px 24px", display: "flex", gap: 10 }}>
          <button
            onClick={() => setPhase("camera")}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "none",
            }}
          >
            <Camera size={16} /> Scan Next Page
          </button>
          <button
            onClick={() => setPhase("pages")}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: 14,
              border: "none",
              background: "#e11d48",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Check size={16} /> Review ({pages.length})
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. PAGES REVIEW & EXPORT PHASE
  // ═════════════════════════════════════════════════════════════════════════════
  if (phase === "pages") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page, #ffffff)", color: "var(--text-primary, #0f172a)", display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "var(--bg-header, #ffffff)", borderBottom: "1px solid var(--border-color, rgba(0,0,0,0.1))" }}>
          <button onClick={() => setPhase("camera")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary, inherit)", display: "flex", padding: 4 }}>
            <X size={20} />
          </button>
          <strong style={{ flex: 1, fontSize: 16, fontWeight: 800 }}>Pages in Document ({pages.length})</strong>
          <button
            onClick={() => setPhase("camera")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(225,29,72,0.1)", border: "none", color: "#e11d48", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            <Plus size={15} /> Add Page
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {/* Filename */}
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, border: "1px solid var(--border-color, rgba(0,0,0,0.1))" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-secondary, #64748b)", marginBottom: 6 }}>
              Document Filename
            </label>
            <input
              value={pdfName}
              onChange={(e) => setPdfName(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid var(--border-color, rgba(0,0,0,0.12))",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 14,
                fontWeight: 700,
                outline: "none",
                background: "var(--bg-input, transparent)",
                color: "var(--text-primary, inherit)",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Grid of scanned pages */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
            {pages.map((p, i) => (
              <div key={p.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-color, rgba(0,0,0,0.1))", aspectRatio: "3/4", background: "var(--bg-chip, #f1f3f5)" }}>
                <img src={p.enhanced || p.uri} alt={`Page ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>Page {i + 1}</span>
                  <button
                    onClick={() => setPages((prev) => prev.filter((x) => x.id !== p.id))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#f43f5e", display: "flex", padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions bar */}
        <div style={{ padding: "14px 18px", background: "var(--bg-header, #ffffff)", borderTop: "1px solid var(--border-color, rgba(0,0,0,0.1))", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={doOCR}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 14,
                border: "1px solid var(--border-color, rgba(0,0,0,0.12))",
                background: "var(--bg-card, transparent)",
                color: "var(--text-primary, inherit)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <FileText size={16} /> {ocrLoading ? "Running OCR…" : "Extract Text (OCR)"}
            </button>
            <button
              onClick={async () => {
                const uri = await buildPDF();
                onInsertToNote(pages, uri);
              }}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 14,
                border: "none",
                background: "#e11d48",
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Check size={16} /> Save to OWNLY
            </button>
          </div>
          <button
            onClick={async () => {
              const uri = await buildPDF();
              const a = document.createElement("a");
              a.href = uri;
              a.download = `${pdfName}.pdf`;
              a.click();
            }}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 14,
              border: "none",
              background: "var(--bg-chip, #f1f3f5)",
              color: "var(--text-primary, inherit)",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Download size={16} /> Download as PDF
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. OCR RESULT PHASE
  // ═════════════════════════════════════════════════════════════════════════════
  if (phase === "ocr") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page, #ffffff)", color: "var(--text-primary, #0f172a)", display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "var(--bg-header, #ffffff)", borderBottom: "1px solid var(--border-color, rgba(0,0,0,0.1))" }}>
          <button onClick={() => setPhase("pages")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary, inherit)", display: "flex", padding: 4 }}>
            <X size={20} />
          </button>
          <strong style={{ flex: 1, fontSize: 16, fontWeight: 800 }}>Extracted Document Text</strong>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(ocrText);
              alert("Copied to clipboard!");
            }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#e11d48", fontWeight: 700, fontSize: 13 }}
          >
            Copy
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {ocrText ? (
            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              style={{
                width: "100%",
                height: "60vh",
                border: "1px solid var(--border-color, rgba(0,0,0,0.12))",
                borderRadius: 14,
                padding: 14,
                fontSize: 14,
                lineHeight: 1.6,
                background: "var(--bg-input, transparent)",
                color: "var(--text-primary, inherit)",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "monospace",
              }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary, #64748b)" }}>
              <p>No text detected. Try scanning with good lighting or Black & White mode.</p>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 18px", background: "var(--bg-header, #ffffff)", borderTop: "1px solid var(--border-color, rgba(0,0,0,0.1))", display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              onInsertToNote(pages);
            }}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              border: "none",
              background: "#e11d48",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Insert Text into Note
          </button>
        </div>
      </div>
    );
  }

  return null;
}
