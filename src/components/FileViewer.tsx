import { useState, useEffect } from "react";
import { ShareModal } from "./ShareModal";
import { shareFileNative, resolveFileUri } from "../lib/shareHelper";

export interface ViewableFile {
  id?: string;
  name: string;
  type: string;
  uri: string;
  size?: string;
}

function Ic({ d, size = 20, sw = 1.8 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const IC = {
  back: "M15 18l-6-6 6-6",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  down: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  zoom_in: "M11 8v6M8 11h6M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0",
  zoom_out: "M8 11h6M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0",
  rotate: "M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67",
  alert: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  ext: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
};

function isImage(f: ViewableFile) { return f.type.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(f.name); }
function isVideo(f: ViewableFile) { return f.type.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name); }
function isPDF(f: ViewableFile)   { return f.type === "application/pdf" || /\.pdf$/i.test(f.name); }

// ─── ERROR STATE COMPONENT ────────────────────────────────────────────────────
function FileErrorView({
  file,
  onBack,
  onDelete
}: {
  file: ViewableFile;
  onBack(): void;
  onDelete?(): void;
}) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:510, background:"#09090b", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, textAlign:"center", color:"#fff" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(225,29,72,0.15)", color:"#fb7185", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
        <Ic d={IC.alert} size={36} />
      </div>
      <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 8px", fontFamily:"Manrope,sans-serif" }}>File Could Not Be Loaded</h2>
      <p style={{ fontSize:13, opacity:0.7, maxWidth:340, lineHeight:1.5, margin:"0 0 24px" }}>
        "{file.name}" was stored using a temporary session link that has expired, or the file data is no longer available on this device.
      </p>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
        {onDelete && (
          <button
            onClick={onDelete}
            style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 22px", borderRadius:24, background:"#dc2626", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}
          >
            <Ic d={IC.trash} size={16} /> Delete Broken File
          </button>
        )}
        <button
          onClick={onBack}
          style={{ padding:"10px 24px", borderRadius:24, background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

// ─── IMAGE VIEWER ─────────────────────────────────────────────────────────────
function ImageViewer({
  file,
  onBack,
  onOpenShare,
  onDelete
}: {
  file: ViewableFile;
  onBack(): void;
  onOpenShare(): void;
  onDelete?(): void;
}) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [fitMode, setFitMode] = useState<"contain" | "width" | "original">("contain");
  const [activeUri, setActiveUri] = useState<string>(file.uri);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    if (file.uri && file.uri.startsWith('__lazy__')) {
      setLoading(true);
      resolveFileUri(file).then(resolved => {
        if (isMounted) {
          if (resolved && !resolved.startsWith('__lazy__') && !resolved.startsWith('blob:')) {
            setActiveUri(resolved);
            setLoadError(false);
          } else if (resolved && resolved.startsWith('blob:')) {
            fetch(resolved)
              .then(r => {
                if (isMounted) {
                  if (r.ok) { setActiveUri(resolved); setLoadError(false); }
                  else { setLoadError(true); }
                }
              })
              .catch(() => { if (isMounted) setLoadError(true); });
          } else {
            setLoadError(true);
          }
          setLoading(false);
        }
      }).catch(() => {
        if (isMounted) {
          setLoading(false);
          setLoadError(true);
        }
      });
    } else if (file.uri && file.uri.startsWith('blob:')) {
      fetch(file.uri)
        .then(r => {
          if (isMounted) {
            if (r.ok) { setActiveUri(file.uri); setLoadError(false); }
            else { setLoadError(true); }
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setLoadError(true);
            setLoading(false);
          }
        });
    } else {
      setActiveUri(file.uri);
      setLoading(false);
      setLoadError(!file.uri);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [file]);

  if (loadError) {
    return <FileErrorView file={file} onBack={onBack} onDelete={onDelete} />;
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"#09090b", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"rgba(0,0,0,.85)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:4 }} title="Back">
          <Ic d={IC.back} size={22} />
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {file.name}
          </div>
          {file.size && <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{file.size}</div>}
        </div>
        <button onClick={()=>setRotate(r=> (r+90) % 360)} title="Rotate (90°)" style={{ background:"rgba(255,255,255,0.1)",borderRadius:8,border:"none",cursor:"pointer",color:"#fff",padding:6 }}>
          <Ic d={IC.rotate} size={18} />
        </button>
        <button onClick={()=>setFitMode(m => m === 'contain' ? 'width' : m === 'width' ? 'original' : 'contain')}
          title={`Fit: ${fitMode}`}
          style={{ background:"rgba(255,255,255,0.1)", borderRadius:8, border:"none", cursor:"pointer", color:"#fff", padding:"4px 8px", fontSize:11, fontWeight:700 }}>
          {fitMode === 'contain' ? 'Fit Screen' : fitMode === 'width' ? 'Fit Width' : '100% Original'}
        </button>
        <button onClick={()=>setScale(s=>Math.min(s+0.25,5))} title="Zoom In" style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.85)",padding:6 }}>
          <Ic d={IC.zoom_in} size={18} />
        </button>
        <button onClick={()=>setScale(s=>Math.max(s-0.25,0.25))} title="Zoom Out" style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.85)",padding:6 }}>
          <Ic d={IC.zoom_out} size={18} />
        </button>
        <button onClick={onOpenShare} title="Share" style={{ background:"#25d366",border:"none",cursor:"pointer",color:"#fff",padding:"6px 12px",borderRadius:16,display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700 }}>
          <Ic d={IC.share} size={15} /> Share
        </button>
      </div>

      {/* Main Image Area with high-quality rendering, uncompressed natural aspect ratio */}
      <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", padding:12, position:"relative", WebkitOverflowScrolling:"touch" }}>
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, color:"#fff" }}>
            <div style={{ width:36, height:36, border:"3px solid rgba(255,255,255,.2)", borderTopColor:"#e11d48", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            <span style={{ fontSize:13, opacity:0.7 }}>Loading image…</span>
            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          </div>
        ) : (
          <img
            src={activeUri}
            alt={file.name}
            onError={() => setLoadError(true)}
            style={{
              width: fitMode === "width" ? "100%" : fitMode === "original" ? "auto" : undefined,
              height: fitMode === "original" ? "auto" : undefined,
              maxWidth: fitMode === "contain" ? "100%" : "none",
              maxHeight: fitMode === "contain" ? "100%" : "none",
              transform:`scale(${scale}) rotate(${rotate}deg)`,
              transformOrigin:"center",
              transition:"transform .2s ease",
              objectFit: fitMode === "contain" ? "contain" : "initial",
              imageRendering: "auto",
              userSelect:"none"
            }}
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div style={{ padding:"12px 16px", background:"rgba(0,0,0,.85)", display:"flex", gap:10, justifyContent:"center", alignItems:"center", borderTop:"1px solid rgba(255,255,255,.1)" }}>
        <button onClick={()=>{ setScale(1); setRotate(0); setFitMode("contain"); }} style={{ padding:"8px 16px",borderRadius:20,background:"rgba(255,255,255,.12)",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>
          Reset
        </button>
        <a href={activeUri} download={file.name} style={{ padding:"8px 18px",borderRadius:20,background:"rgba(255,255,255,.15)",color:"#fff",fontSize:12,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.down} size={15} /> Save
        </a>
        <button onClick={onOpenShare} style={{ padding:"8px 20px",borderRadius:20,background:"#25d366",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.share} size={15} /> Share (WhatsApp)
        </button>
        {onDelete && (
          <button onClick={onDelete} title="Delete File" style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", padding:8, display:"flex" }}>
            <Ic d={IC.trash} size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PDF VIEWER ───────────────────────────────────────────────────────────────
function PDFViewer({
  file,
  onBack,
  onOpenShare,
  onDelete
}: {
  file: ViewableFile;
  onBack(): void;
  onOpenShare(): void;
  onDelete?(): void;
}) {
  const [activeUri, setActiveUri] = useState<string>(file.uri);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    if (file.uri && file.uri.startsWith('__lazy__')) {
      setLoading(true);
      resolveFileUri(file).then(resolved => {
        if (isMounted) {
          if (resolved && !resolved.startsWith('__lazy__') && !resolved.startsWith('blob:')) {
            setActiveUri(resolved);
            setLoadError(false);
          } else if (resolved && resolved.startsWith('blob:')) {
            fetch(resolved)
              .then(r => {
                if (isMounted) {
                  if (r.ok) { setActiveUri(resolved); setLoadError(false); }
                  else { setLoadError(true); }
                }
              })
              .catch(() => { if (isMounted) setLoadError(true); });
          } else {
            setLoadError(true);
          }
          setLoading(false);
        }
      }).catch(() => {
        if (isMounted) {
          setLoading(false);
          setLoadError(true);
        }
      });
    } else if (file.uri && file.uri.startsWith('blob:')) {
      fetch(file.uri)
        .then(r => {
          if (isMounted) {
            if (r.ok) { setActiveUri(file.uri); setLoadError(false); }
            else { setLoadError(true); }
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setLoadError(true);
            setLoading(false);
          }
        });
    } else {
      setActiveUri(file.uri);
      setLoading(false);
      setLoadError(!file.uri);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [file]);

  if (loadError) {
    return <FileErrorView file={file} onBack={onBack} onDelete={onDelete} />;
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", flexDirection:"column", background:"#0f172a" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"#1e293b", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:4 }}>
          <Ic d={IC.back} size={22} />
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {file.name}
          </div>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>PDF Document {file.size ? `• ${file.size}` : ''}</div>
        </div>
        <a href={activeUri} download={file.name} title="Download PDF" style={{ color:"rgba(255,255,255,.85)",display:"flex",padding:6,textDecoration:"none" }}>
          <Ic d={IC.down} size={20} />
        </a>
        <button onClick={onOpenShare} title="Share PDF" style={{ background:"#25d366",border:"none",cursor:"pointer",color:"#fff",padding:"6px 12px",borderRadius:16,display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700 }}>
          <Ic d={IC.share} size={15} /> Share
        </button>
      </div>

      {/* PDF Content: Direct iframe/object render - zero external CDN hang! */}
      <div style={{ flex:1, overflow:"hidden", background:"#0b0f19", position:"relative", display:"flex", flexDirection:"column" }}>
        {loading ? (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#0f172a", color:"#fff", gap:10 }}>
            <div style={{ width:32, height:32, border:"3px solid rgba(255,255,255,.2)", borderTopColor:"#e11d48", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            <span style={{ fontSize:12, opacity:0.7 }}>Loading PDF…</span>
          </div>
        ) : (
          <object
            data={activeUri}
            type="application/pdf"
            style={{ width:"100%", height:"100%", border:"none", flex:1 }}
          >
            {/* Fallback if browser/WebView doesn't support inline PDF plugin */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding:24, textAlign:"center", color:"#fff" }}>
              <div style={{ width:60, height:60, borderRadius:16, background:"rgba(225,29,72,0.15)", color:"#fb7185", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, fontSize:28 }}>
                📄
              </div>
              <h3 style={{ fontSize:16, fontWeight:800, margin:"0 0 6px", fontFamily:"Manrope,sans-serif" }}>{file.name}</h3>
              <p style={{ fontSize:12, opacity:0.7, maxWidth:300, margin:"0 0 20px" }}>
                Ready to view or share on your device.
              </p>
              <div style={{ display:"flex", gap:12 }}>
                <a href={activeUri} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:20, background:"#e11d48", color:"#fff", textDecoration:"none", fontSize:13, fontWeight:700 }}>
                  <Ic d={IC.ext} size={16} /> Open PDF
                </a>
                <button onClick={onOpenShare} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:20, background:"#25d366", color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  <Ic d={IC.share} size={16} /> Share
                </button>
              </div>
            </div>
          </object>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:"10px 16px", background:"#1e293b", display:"flex", gap:10, justifyContent:"center", alignItems:"center", borderTop:"1px solid rgba(255,255,255,.1)" }}>
        <a href={activeUri} download={file.name} style={{ padding:"8px 18px",borderRadius:20,background:"rgba(255,255,255,.15)",color:"#fff",fontSize:12,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.down} size={14} /> Download
        </a>
        <button onClick={onOpenShare} style={{ padding:"8px 20px",borderRadius:20,background:"#25d366",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.share} size={14} /> Share PDF (WhatsApp)
        </button>
        {onDelete && (
          <button onClick={onDelete} title="Delete File" style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", padding:8, display:"flex" }}>
            <Ic d={IC.trash} size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── VIDEO VIEWER ─────────────────────────────────────────────────────────────
function VideoViewer({
  file,
  onBack,
  onOpenShare,
  onDelete
}: {
  file: ViewableFile;
  onBack(): void;
  onOpenShare(): void;
  onDelete?(): void;
}) {
  const [activeUri, setActiveUri] = useState<string>(file.uri);

  useEffect(() => {
    if (file.uri && file.uri.startsWith('__lazy__')) {
      resolveFileUri(file).then(setActiveUri).catch(() => {});
    } else {
      setActiveUri(file.uri);
    }
  }, [file]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"#000", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"rgba(0,0,0,.8)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:4 }}>
          <Ic d={IC.back} size={22} />
        </button>
        <span style={{ flex:1, color:"#fff", fontSize:14, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
        <button onClick={onOpenShare} style={{ background:"#25d366",border:"none",cursor:"pointer",color:"#fff",padding:"6px 12px",borderRadius:16,display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700 }}>
          <Ic d={IC.share} size={15} /> Share
        </button>
        {onDelete && (
          <button onClick={onDelete} title="Delete File" style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", padding:6, display:"flex" }}>
            <Ic d={IC.trash} size={18} />
          </button>
        )}
      </div>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#000" }}>
        <video src={activeUri} controls autoPlay style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
      </div>
    </div>
  );
}

// ─── DOC VIEWER ───────────────────────────────────────────────────────────────
function DocFileViewer({
  file,
  onBack,
  onOpenShare,
  onDelete
}: {
  file: ViewableFile;
  onBack(): void;
  onOpenShare(): void;
  onDelete?(): void;
}) {
  const [activeUri, setActiveUri] = useState<string>(file.uri);

  useEffect(() => {
    if (file.uri && file.uri.startsWith('__lazy__')) {
      resolveFileUri(file).then(setActiveUri).catch(() => {});
    } else {
      setActiveUri(file.uri);
    }
  }, [file]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", flexDirection:"column", background:"var(--bg-page, #ffffff)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"var(--bg-header, #f8fafc)", borderBottom:"1px solid var(--border-color, rgba(0,0,0,0.1))" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-primary, #000)",display:"flex",padding:4 }}>
          <Ic d={IC.back} size={22} />
        </button>
        <span style={{ flex:1, color:"var(--text-primary, #000)", fontSize:14, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
        <a href={activeUri} download={file.name} style={{ color:"var(--text-secondary, #666)",display:"flex",padding:6,textDecoration:"none" }}>
          <Ic d={IC.down} size={18} />
        </a>
        <button onClick={onOpenShare} style={{ background:"#25d366",border:"none",cursor:"pointer",color:"#fff",padding:"6px 12px",borderRadius:16,display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700 }}>
          <Ic d={IC.share} size={15} /> Share
        </button>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:16, background:"rgba(159,18,57,0.1)", color:"#9f1239", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, fontSize:28 }}>
          📁
        </div>
        <h3 style={{ fontSize:16, fontWeight:800, margin:"0 0 6px", fontFamily:"Manrope,sans-serif", color:"var(--text-primary, #000)" }}>{file.name}</h3>
        <p style={{ fontSize:13, color:"var(--text-secondary, #666)", maxWidth:320, margin:"0 0 24px" }}>
          This document can be downloaded or shared directly to WhatsApp and other apps.
        </p>
        <div style={{ display:"flex", gap:12 }}>
          <a href={activeUri} download={file.name} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 22px", borderRadius:20, background:"#9f1239", color:"#fff", textDecoration:"none", fontSize:13, fontWeight:700 }}>
            <Ic d={IC.down} size={16} /> Download
          </a>
          <button onClick={onOpenShare} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 22px", borderRadius:20, background:"#25d366", color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            <Ic d={IC.share} size={16} /> Share File
          </button>
        </div>
        {onDelete && (
          <button onClick={onDelete} style={{ marginTop:24, background:"none", border:"none", color:"#dc2626", fontSize:12, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}>
            <Ic d={IC.trash} size={14} /> Delete this file
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MAIN UNIVERSAL VIEWER ────────────────────────────────────────────────────
export default function FileViewer({
  file,
  onBack,
  onDelete
}: {
  file: ViewableFile;
  onBack(): void;
  onDelete?: (id: string) => void;
}) {
  const [shareModalOpen, setShareModalOpen] = useState(false);

  async function handleQuickShare() {
    const res = await shareFileNative(file);
    if (!res.success && !res.cancelled) {
      setShareModalOpen(true);
    }
  }

  function handleDeleteCurrent() {
    if (file.id && onDelete) {
      onDelete(file.id);
    } else {
      onBack();
    }
  }

  return (
    <>
      {isImage(file) && <ImageViewer file={file} onBack={onBack} onOpenShare={handleQuickShare} onDelete={handleDeleteCurrent} />}
      {isVideo(file) && <VideoViewer file={file} onBack={onBack} onOpenShare={handleQuickShare} onDelete={handleDeleteCurrent} />}
      {isPDF(file)   && <PDFViewer   file={file} onBack={onBack} onOpenShare={handleQuickShare} onDelete={handleDeleteCurrent} />}
      {!isImage(file) && !isVideo(file) && !isPDF(file) && (
        <DocFileViewer file={file} onBack={onBack} onOpenShare={handleQuickShare} onDelete={handleDeleteCurrent} />
      )}

      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          file={file}
        />
      )}
    </>
  );
}
