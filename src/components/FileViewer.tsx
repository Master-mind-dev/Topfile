import { useState, useRef } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

export interface ViewableFile {
  name: string; type: string; uri: string; size?: string;
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
  prev: "M15 18l-6-6 6-6",
  next: "M9 18l6-6-6-6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  copy: "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1",
  full: "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
};

function isImage(f: ViewableFile) { return f.type.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(f.name); }
function isVideo(f: ViewableFile) { return f.type.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name); }
function isPDF(f: ViewableFile)   { return f.type === "application/pdf" || /\.pdf$/i.test(f.name); }
function isText(f: ViewableFile)  { return f.type.startsWith("text/") || /\.(txt|csv|md|json|xml|html|js|ts|css)$/i.test(f.name); }

// ─── IMAGE VIEWER ─────────────────────────────────────────────────────────────
function ImageViewer({ file, onBack }: { file: ViewableFile; onBack(): void }) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"#000", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(0,0,0,.8)", backdropFilter:"blur(10px)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:4 }}>
          <Ic d={IC.back} size={22} />
        </button>
        <span style={{ flex:1, color:"#fff", fontSize:13, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
        <button onClick={()=>setRotate(r=>r+90)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.8)",fontSize:11,fontWeight:700,padding:"4px 8px" }}>⟳</button>
        <button onClick={()=>setScale(s=>Math.min(s+0.25,4))} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.8)",padding:4 }}><Ic d={IC.zoom_in} size={18} /></button>
        <button onClick={()=>setScale(s=>Math.max(s-0.25,0.5))} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.8)",padding:4 }}><Ic d={IC.zoom_out} size={18} /></button>
      </div>
      <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src={file.uri} alt={file.name}
          style={{ maxWidth:"100%", transform:`scale(${scale}) rotate(${rotate}deg)`, transformOrigin:"center", transition:"transform .2s", objectFit:"contain" }} />
      </div>
      <div style={{ padding:"10px 14px", background:"rgba(0,0,0,.8)", display:"flex", gap:10, justifyContent:"center" }}>
        <button onClick={()=>setScale(1)} style={{ padding:"6px 16px",borderRadius:20,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Reset</button>
        <a href={file.uri} download={file.name} style={{ padding:"6px 16px",borderRadius:20,background:"#9f1239",color:"#fff",fontSize:12,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.down} size={14} /> Save
        </a>
        {navigator.share && (
          <button onClick={()=>navigator.share({title:file.name,url:file.uri}).catch(()=>{})} style={{ padding:"6px 16px",borderRadius:20,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Share</button>
        )}
      </div>
    </div>
  );
}

// ─── PDF VIEWER ───────────────────────────────────────────────────────────────
function PDFViewer({ file, onBack }: { file: ViewableFile; onBack(): void }) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", flexDirection:"column", background:"#1a1a2e" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(13,13,20,.95)", backdropFilter:"blur(10px)", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:4 }}>
          <Ic d={IC.back} size={22} />
        </button>
        <span style={{ flex:1, color:"#fff", fontSize:13, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
        <button onClick={()=>setShowSearch(v=>!v)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.8)",padding:4 }}>
          <Ic d={IC.search} size={18} />
        </button>
        <a href={file.uri} download={file.name} style={{ color:"rgba(255,255,255,.8)",display:"flex",padding:4,textDecoration:"none" }}>
          <Ic d={IC.down} size={18} />
        </a>
      </div>

      {showSearch && (
        <div style={{ padding:"8px 14px", background:"rgba(13,13,20,.9)", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search in document…"
            style={{ width:"100%", border:"1px solid rgba(255,255,255,.2)", borderRadius:10, padding:"8px 12px", fontSize:13, outline:"none", background:"rgba(255,255,255,.1)", color:"#fff", boxSizing:"border-box" as const, fontFamily:"inherit" }} />
        </div>
      )}

      <div style={{ flex:1, overflow:"hidden" }}>
        <iframe ref={iframeRef} src={file.uri + "#toolbar=1&navpanes=1&view=FitH"}
          title={file.name}
          style={{ width:"100%", height:"100%", border:"none", background:"#fff" }} />
      </div>

      <div style={{ padding:"8px 14px", background:"rgba(13,13,20,.95)", display:"flex", gap:8, justifyContent:"center" }}>
        <button onClick={()=>setShowSearch(v=>!v)} style={{ padding:"6px 14px",borderRadius:20,background:"rgba(255,255,255,.12)",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.search} size={13} /> Search
        </button>
        <a href={file.uri} download={file.name} style={{ padding:"6px 14px",borderRadius:20,background:"#9f1239",color:"#fff",fontSize:12,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:6 }}>
          <Ic d={IC.down} size={13} /> Download
        </a>
        {navigator.share && (
          <button onClick={()=>navigator.share({title:file.name,url:file.uri}).catch(()=>{})} style={{ padding:"6px 14px",borderRadius:20,background:"rgba(255,255,255,.12)",border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Share</button>
        )}
      </div>
    </div>
  );
}

// ─── VIDEO VIEWER ─────────────────────────────────────────────────────────────
function VideoViewer({ file, onBack }: { file: ViewableFile; onBack(): void }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"#000", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(0,0,0,.8)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:4 }}>
          <Ic d={IC.back} size={22} />
        </button>
        <span style={{ flex:1, color:"#fff", fontSize:13, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
      </div>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#000" }}>
        <video src={file.uri} controls autoPlay
          style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
      </div>
    </div>
  );
}

// ─── DOC VIEWER (Word/Excel/PPT via react-doc-viewer) ─────────────────────────
function DocFileViewer({ file, onBack }: { file: ViewableFile; onBack(): void }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", flexDirection:"column", background:"var(--bg-page)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--bg-header)", borderBottom:"1px solid var(--border-color)", backdropFilter:"blur(10px)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-primary)",display:"flex",padding:4 }}>
          <Ic d={IC.back} size={22} />
        </button>
        <span style={{ flex:1, color:"var(--text-primary)", fontSize:13, fontWeight:700, fontFamily:"Manrope,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
        <a href={file.uri} download={file.name} style={{ color:"var(--text-secondary)",display:"flex",padding:4,textDecoration:"none" }}>
          <Ic d={IC.down} size={18} />
        </a>
      </div>
      <div style={{ flex:1, overflow:"hidden", background:"#fff" }}>
        <DocViewer
          documents={[{ uri: file.uri, fileName: file.name }]}
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
  if (isImage(file)) return <ImageViewer file={file} onBack={onBack} />;
  if (isVideo(file)) return <VideoViewer file={file} onBack={onBack} />;
  if (isPDF(file))   return <PDFViewer   file={file} onBack={onBack} />;
  return <DocFileViewer file={file} onBack={onBack} />;
}
