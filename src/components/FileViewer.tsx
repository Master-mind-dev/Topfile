import { useState, useEffect } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
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
};

function isImage(f: ViewableFile) { return f.type.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(f.name); }
function isVideo(f: ViewableFile) { return f.type.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name); }
function isPDF(f: ViewableFile)   { return f.type === "application/pdf" || /\.pdf$/i.test(f.name); }

// ─── IMAGE VIEWER ─────────────────────────────────────────────────────────────
function ImageViewer({ file, onBack, onOpenShare }: { file: ViewableFile; onBack(): void; onOpenShare(): void }) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [activeUri, setActiveUri] = useState<string>(file.uri);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (file.uri && file.uri.startsWith('__lazy__')) {
      setLoading(true);
      resolveFileUri(file).then(resolved => {
        if (isMounted) {
          setActiveUri(resolved);
          setLoading(false);
        }
      }).catch(() => {
        if (isMounted) {
          setLoading(false);
          setLoadError(true);
        }
      });
    } else {
      setActiveUri(file.uri);
    }
    return () => { isMounted = false; };
  }, [file]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"#09090b", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"rgba(0,0,0,.85)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:4 }}>
          <Ic d={IC.back} size={22} />
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {file.name}
          </div>
          {file.size && <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{file.size}</div>}
        </div>
        <button onClick={()=>setRotate(r=>r+90)} title="Rotate" style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.85)",padding:6 }}>
          <Ic d={IC.rotate} size={18} />
        </button>
        <button onClick={()=>setScale(s=>Math.min(s+0.25,4))} title="Zoom In" style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.85)",padding:6 }}>
          <Ic d={IC.zoom_in} size={18} />
        </button>
        <button onClick={()=>setScale(s=>Math.max(s-0.25,0.5))} title="Zoom Out" style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.85)",padding:6 }}>
          <Ic d={IC.zoom_out} size={18} />
        </button>
        <button onClick={onOpenShare} title="Share" style={{ background:"#25d366",border:"none",cursor:"pointer",color:"#fff",padding:"6px 12px",borderRadius:16,display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700 }}>
          <Ic d={IC.share} size={15} /> Share
        </button>
      </div>

      {/* Main Image Area */}
      <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", padding:16, position:"relative" }}>
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, color:"#fff" }}>
            <div style={{ width:36, height:36, border:"3px solid rgba(255,255,255,.2)", borderTopColor:"#e11d48", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            <span style={{ fontSize:13, opacity:0.7 }}>Loading image…</span>
            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          </div>
        ) : loadError ? (
          <div style={{ textAlign:"center", color:"#fff", maxWidth:300 }}>
            <div style={{ color:"#fb7185", marginBottom:8 }}><Ic d={IC.alert} size={36} /></div>
            <p style={{ fontSize:14, fontWeight:700, margin:"0 0 6px" }}>Could not display image</p>
            <p style={{ fontSize:12, opacity:0.6, margin:"0 0 16px" }}>The file data could not be rendered.</p>
            <a href={activeUri} download={file.name} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 18px", borderRadius:20, background:"#e11d48", color:"#fff", textDecoration:"none", fontSize:12, fontWeight:700 }}>
              <Ic d={IC.down} size={14} /> Download File
            </a>
          </div>
        ) : (
          <img
            src={activeUri}
            alt={file.name}
            onError={() => setLoadError(true)}
            style={{
              maxWidth:"100%",
              maxHeight:"100%",
              transform:`scale(${scale}) rotate(${rotate}deg)`,
              transformOrigin:"center",
              transition:"transform .2s ease",
              objectFit:"contain",
              userSelect:"none"
            }}
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div style={{ padding:"12px 16px", background:"rgba(0,0,0,.85)", display:"flex", gap:10, justifyContent:"center", borderTop:"1px solid rgba(255,255,255,.1)" }}>
        <button onClick={()=>{ setScale(1); setRotate(0); }} style={{ padding:"8px 16px",borderRadius:20,background:"rgba(255,255,255,.12)",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>
          Reset Zoom
        </button>
        <a href={activeUri} download={file.name} style={{ padding:"8px 18px",borderRadius:20,background:"rgba(255,255,255,.15)",color:"#fff",fontSize:12,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.down} size={15} /> Save
        </a>
        <button onClick={onOpenShare} style={{ padding:"8px 20px",borderRadius:20,background:"#25d366",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.share} size={15} /> Share to WhatsApp / Apps
        </button>
      </div>
    </div>
  );
}

// ─── PDF VIEWER ───────────────────────────────────────────────────────────────
function PDFViewer({ file, onBack, onOpenShare }: { file: ViewableFile; onBack(): void; onOpenShare(): void }) {
  const [activeUri, setActiveUri] = useState<string>(file.uri);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (file.uri && file.uri.startsWith('__lazy__')) {
      setLoading(true);
      resolveFileUri(file).then(resolved => {
        if (isMounted) {
          setActiveUri(resolved);
          setLoading(false);
        }
      }).catch(() => {
        if (isMounted) setLoading(false);
      });
    } else {
      setActiveUri(file.uri);
    }
    return () => { isMounted = false; };
  }, [file]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", flexDirection:"column", background:"#111827" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"#1f2937", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:4 }}>
          <Ic d={IC.back} size={22} />
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {file.name}
          </div>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>PDF Document</div>
        </div>
        <a href={activeUri} download={file.name} title="Download PDF" style={{ color:"rgba(255,255,255,.85)",display:"flex",padding:6,textDecoration:"none" }}>
          <Ic d={IC.down} size={20} />
        </a>
        <button onClick={onOpenShare} title="Share PDF" style={{ background:"#25d366",border:"none",cursor:"pointer",color:"#fff",padding:"6px 12px",borderRadius:16,display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700 }}>
          <Ic d={IC.share} size={15} /> Share
        </button>
      </div>

      {/* PDF Content via DocViewer (supports Android WebView & Desktop) */}
      <div style={{ flex:1, overflow:"hidden", background:"#ffffff", position:"relative" }}>
        {loading ? (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#111827", color:"#fff" }}>
            <div style={{ width:32, height:32, border:"3px solid rgba(255,255,255,.2)", borderTopColor:"#e11d48", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <DocViewer
            documents={[{ uri: activeUri, fileName: file.name }]}
            pluginRenderers={DocViewerRenderers}
            style={{ width:"100%", height:"100%" }}
            config={{ header: { disableHeader: true }, pdfVerticalScrollByDefault: true }}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:"10px 16px", background:"#1f2937", display:"flex", gap:10, justifyContent:"center", borderTop:"1px solid rgba(255,255,255,.1)" }}>
        <a href={activeUri} download={file.name} style={{ padding:"8px 18px",borderRadius:20,background:"rgba(255,255,255,.15)",color:"#fff",fontSize:12,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.down} size={14} /> Download
        </a>
        <button onClick={onOpenShare} style={{ padding:"8px 20px",borderRadius:20,background:"#25d366",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.share} size={14} /> Share PDF
        </button>
      </div>
    </div>
  );
}

// ─── VIDEO VIEWER ─────────────────────────────────────────────────────────────
function VideoViewer({ file, onBack, onOpenShare }: { file: ViewableFile; onBack(): void; onOpenShare(): void }) {
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
      </div>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#000" }}>
        <video src={activeUri} controls autoPlay style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
      </div>
    </div>
  );
}

// ─── DOC VIEWER ───────────────────────────────────────────────────────────────
function DocFileViewer({ file, onBack, onOpenShare }: { file: ViewableFile; onBack(): void; onOpenShare(): void }) {
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
      <div style={{ flex:1, overflow:"hidden", background:"#fff" }}>
        <DocViewer
          documents={[{ uri: activeUri, fileName: file.name }]}
          pluginRenderers={DocViewerRenderers}
          style={{ width:"100%", height:"100%" }}
          config={{ header: { disableHeader: true }, pdfVerticalScrollByDefault: true }}
        />
      </div>
    </div>
  );
}

// ─── MAIN UNIVERSAL VIEWER ────────────────────────────────────────────────────
export default function FileViewer({ file, onBack }: { file: ViewableFile; onBack(): void }) {
  const [shareModalOpen, setShareModalOpen] = useState(false);

  async function handleQuickShare() {
    // Attempt native share first (which launches WhatsApp / Android share sheet directly)
    const res = await shareFileNative(file);
    if (!res.success && !res.cancelled) {
      // If not supported natively on this device, open the Share Modal
      setShareModalOpen(true);
    }
  }

  return (
    <>
      {isImage(file) && <ImageViewer file={file} onBack={onBack} onOpenShare={handleQuickShare} />}
      {isVideo(file) && <VideoViewer file={file} onBack={onBack} onOpenShare={handleQuickShare} />}
      {isPDF(file)   && <PDFViewer   file={file} onBack={onBack} onOpenShare={handleQuickShare} />}
      {!isImage(file) && !isVideo(file) && !isPDF(file) && (
        <DocFileViewer file={file} onBack={onBack} onOpenShare={handleQuickShare} />
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
