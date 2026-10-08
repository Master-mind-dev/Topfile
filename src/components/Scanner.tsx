import { useState, useRef, useCallback, ChangeEvent } from "react";
import jsPDF from "jspdf";

export interface ScannedPage { id: string; uri: string; enhanced?: string; mode: EnhanceMode; }
type EnhanceMode = "original" | "auto" | "color" | "grayscale" | "bw";
type Phase = "menu" | "scanning" | "enhance" | "pages" | "ocr";

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
  cam: "M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3zM9 13a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
  img: "M15 8h.01M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM3 16l5-5 5 5 4-4 4 4",
  plus: "M12 5v14M5 12h14",
  check: "M20 6 9 17l-5-5",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  down: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  text: "M4 7V4h16v3M9 20h6M12 4v16",
  copy: "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1",
  note: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  scan: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2",
  x: "M18 6 6 18M6 6l12 12",
};

// ─── Canvas enhancement filter ────────────────────────────────────────────────
function applyFilter(src: string, mode: EnhanceMode): Promise<string> {
  return new Promise(resolve => {
    if (mode === "original") { resolve(src); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        let r = px[i], g = px[i+1], b = px[i+2];
        if (mode === "grayscale" || mode === "bw" || mode === "auto") {
          const gray = Math.round(0.299*r + 0.587*g + 0.114*b);
          if (mode === "bw") {
            const bw = gray > 128 ? 255 : 0;
            px[i] = px[i+1] = px[i+2] = bw;
          } else if (mode === "grayscale") {
            px[i] = px[i+1] = px[i+2] = gray;
          } else { // auto — boost contrast
            const v = Math.min(255, Math.max(0, (gray - 100) * 1.5 + 100));
            px[i] = px[i+1] = px[i+2] = v;
          }
        } else if (mode === "color") {
          // Enhance color saturation
          const avg = (r+g+b)/3;
          px[i]   = Math.min(255, avg + (r-avg)*1.4);
          px[i+1] = Math.min(255, avg + (g-avg)*1.4);
          px[i+2] = Math.min(255, avg + (b-avg)*1.4);
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
  } catch { return ""; }
}

// ─── MAIN SCANNER ─────────────────────────────────────────────────────────────
export default function Scanner({ onBack, onInsertToNote }: {
  onBack(): void;
  onInsertToNote(pages: ScannedPage[], pdfUri?: string): void;
}) {
  const [phase, setPhase]       = useState<Phase>("menu");
  const [pages, setPages]       = useState<ScannedPage[]>([]);
  const [activeId, setActiveId] = useState<string|null>(null);
  const [mode, setMode]         = useState<EnhanceMode>("auto");
  const [pdfName, setPdfName]   = useState("Scanned_Document");
  const [ocrText, setOcrText]   = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const uid = () => `p${Date.now()}${Math.random().toString(36).slice(2)}`;

  const activePage = pages.find(p => p.id === activeId) || pages[pages.length-1] || null;

  // ─ Capture image from file input ─
  async function onCapture(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    const uri = URL.createObjectURL(f);
    const id = uid();
    const enhanced = await applyFilter(uri, "auto");
    const page: ScannedPage = { id, uri, enhanced, mode:"auto" };
    setPages(prev => [...prev, page]);
    setActiveId(id);
    setPhase("enhance");
  }

  // ─ Apply enhancement mode to active page ─
  async function applyMode(m: EnhanceMode) {
    setMode(m);
    if (!activePage) return;
    const result = await applyFilter(activePage.uri, m);
    setPages(prev => prev.map(p => p.id === activePage.id ? { ...p, mode:m, enhanced:result } : p));
  }

  // ─ Build PDF from all pages ─
  async function buildPDF(): Promise<string> {
    const doc = new jsPDF({ unit:"px", compress:true });
    let first = true;
    for (const page of pages) {
      const src = page.enhanced || page.uri;
      if (!first) doc.addPage(); first = false;
      const img = new Image();
      img.src = src;
      await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const ratio = Math.min(W / img.naturalWidth, H / img.naturalHeight);
      const w = img.naturalWidth * ratio, h = img.naturalHeight * ratio;
      const x = (W - w) / 2, y = (H - h) / 2;
      doc.addImage(src, "JPEG", x, y, w, h, undefined, "FAST");
    }
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }

  // ─ OCR all pages ─
  async function doOCR() {
    setOcrLoading(true); setOcrText("");
    let combined = "";
    for (let i = 0; i < pages.length; i++) {
      const src = pages[i].enhanced || pages[i].uri;
      const text = await runOCR(src);
      combined += `--- Page ${i+1} ---\n${text}\n\n`;
    }
    setOcrText(combined.trim()); setOcrLoading(false);
    setPhase("ocr");
  }

  const MODES: { key: EnhanceMode; label: string }[] = [
    { key:"original", label:"Original" },
    { key:"auto",     label:"Auto" },
    { key:"color",    label:"Color" },
    { key:"grayscale",label:"Grayscale" },
    { key:"bw",       label:"B&W" },
  ];

  // ─────────────────────────────────────────────────────────────────────────────

  // PHASE: menu
  if (phase === "menu") return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", color:"var(--text-primary)", display:"flex", flexDirection:"column" }}>
      <header style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"var(--bg-header)", borderBottom:"1px solid var(--border-color)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-primary)",display:"flex",padding:4 }}><Ic d={IC.back} size={22} /></button>
        <strong style={{ fontFamily:"Manrope,sans-serif", fontSize:17, fontWeight:800, color:"var(--text-primary)" }}>Document Scanner</strong>
      </header>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:30, gap:24 }}>
        {/* Illustration */}
        <div style={{ width:160, height:180, borderRadius:20, background:"linear-gradient(150deg,#9f1239,#6e082b)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 20px 50px rgba(159,18,57,.4)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,.05)", borderRadius:"50%", width:200, height:200, top:-50, left:-50 }} />
          <Ic d={IC.scan} size={64} sw={1.2} />
          <div style={{ position:"absolute", bottom:16, left:0, right:0, textAlign:"center", color:"rgba(255,255,255,.8)", fontSize:12, fontWeight:700, fontFamily:"Manrope,sans-serif" }}>SCANNER</div>
        </div>

        <div style={{ textAlign:"center" }}>
          <h2 style={{ margin:"0 0 8px", fontFamily:"Manrope,sans-serif", fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>Scan Documents</h2>
          <p style={{ margin:0, color:"var(--text-secondary)", fontSize:14, lineHeight:1.6 }}>Capture, enhance, OCR and export your documents as PDF</p>
        </div>

        {/* Camera capture */}
        <label style={{ display:"flex", alignItems:"center", gap:12, width:"100%", maxWidth:320, padding:"16px 20px", background:"#9f1239", borderRadius:18, cursor:"pointer", color:"#fff", boxShadow:"0 8px 30px rgba(159,18,57,.4)" }}>
          <Ic d={IC.cam} size={28} />
          <div>
            <div style={{ fontWeight:800, fontFamily:"Manrope,sans-serif", fontSize:15 }}>Use Camera</div>
            <div style={{ fontSize:12, opacity:.85 }}>Take a photo to scan</div>
          </div>
          <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={onCapture} />
        </label>

        <label style={{ display:"flex", alignItems:"center", gap:12, width:"100%", maxWidth:320, padding:"16px 20px", background:"var(--bg-card)", borderRadius:18, cursor:"pointer", color:"var(--text-primary)", border:"1px solid var(--border-color)", boxShadow:"var(--shadow-card)" }}>
          <Ic d={IC.img} size={28} />
          <div>
            <div style={{ fontWeight:800, fontFamily:"Manrope,sans-serif", fontSize:15 }}>Choose from Gallery</div>
            <div style={{ fontSize:12, color:"var(--text-secondary)" }}>Select existing image</div>
          </div>
          <input type="file" accept="image/*" multiple style={{ display:"none" }} onChange={onCapture} />
        </label>

        {pages.length > 0 && (
          <button onClick={()=>setPhase("pages")} style={{ width:"100%", maxWidth:320, padding:"14px", borderRadius:18, border:"1px solid var(--border-color)", background:"var(--bg-card)", color:"var(--text-primary)", fontWeight:700, fontFamily:"Manrope,sans-serif", fontSize:14, cursor:"pointer", boxShadow:"var(--shadow-card)" }}>
            View {pages.length} scanned page{pages.length>1?"s":""}
          </button>
        )}
      </div>
    </div>
  );

  // PHASE: enhance
  if (phase === "enhance" && activePage) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#fff", display:"flex", flexDirection:"column" }}>
      <header style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(0,0,0,.8)", backdropFilter:"blur(10px)" }}>
        <button onClick={()=>setPhase("menu")} style={{ background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:4 }}><Ic d={IC.back} size={22} /></button>
        <span style={{ flex:1, fontFamily:"Manrope,sans-serif", fontSize:15, fontWeight:700 }}>Enhance Scan</span>
        <span style={{ fontSize:12, opacity:.7 }}>Page {pages.length}</span>
      </header>

      {/* Preview */}
      <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <img src={activePage.enhanced || activePage.uri} alt=""
          style={{ maxWidth:"100%", maxHeight:"60vh", borderRadius:12, boxShadow:"0 10px 40px rgba(0,0,0,.5)", objectFit:"contain" }} />
      </div>

      {/* Mode chips */}
      <div style={{ padding:"0 12px 12px" }}>
        <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", opacity:.6 }}>Enhancement Mode</p>
        <div style={{ display:"flex", gap:8, overflowX:"auto", scrollbarWidth:"none" }}>
          {MODES.map(m => (
            <button key={m.key} onClick={()=>applyMode(m.key)}
              style={{ padding:"8px 18px", borderRadius:20, border:"none", flexShrink:0, fontWeight:700, fontSize:12, fontFamily:"Manrope,sans-serif", cursor:"pointer", background: mode===m.key ? "#9f1239" : "rgba(255,255,255,.12)", color: mode===m.key ? "#fff" : "rgba(255,255,255,.75)", transition:"all .15s" }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding:"0 12px 20px", display:"flex", gap:10 }}>
        <label style={{ flex:1, padding:"12px", borderRadius:14, background:"rgba(255,255,255,.1)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <Ic d={IC.plus} size={18} /> Add Page
          <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={onCapture} />
        </label>
        <button onClick={()=>setPhase("pages")}
          style={{ flex:2, padding:"12px", borderRadius:14, border:"none", background:"#9f1239", color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"Manrope,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <Ic d={IC.check} size={18} /> Done ({pages.length})
        </button>
      </div>
    </div>
  );

  // PHASE: pages
  if (phase === "pages") return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", color:"var(--text-primary)", display:"flex", flexDirection:"column" }}>
      <header style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--bg-header)", borderBottom:"1px solid var(--border-color)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
        <button onClick={()=>setPhase("menu")} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-primary)",display:"flex",padding:4 }}><Ic d={IC.back} size={22} /></button>
        <strong style={{ flex:1, fontFamily:"Manrope,sans-serif", fontSize:16, fontWeight:800 }}>Scanned Pages ({pages.length})</strong>
        <label style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20, background:"rgba(159,18,57,.12)", cursor:"pointer", color:"#9f1239", fontSize:12, fontWeight:700 }}>
          <Ic d={IC.plus} size={16} /> Add
          <input type="file" accept="image/*" style={{ display:"none" }} onChange={onCapture} />
        </label>
      </header>

      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
        {/* PDF name input */}
        <div style={{ background:"var(--bg-card)", borderRadius:14, padding:"12px 14px", marginBottom:16, border:"1px solid var(--border-color)", boxShadow:"var(--shadow-card)" }}>
          <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text-secondary)", marginBottom:8 }}>PDF Filename</label>
          <input value={pdfName} onChange={e=>setPdfName(e.target.value)}
            style={{ width:"100%", border:"1px solid var(--border-color)", borderRadius:10, padding:"8px 12px", fontSize:13, outline:"none", boxSizing:"border-box" as const, background:"var(--bg-input)", color:"var(--text-primary)", fontFamily:"inherit" }} />
        </div>

        {/* Page grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          {pages.map((p,i) => (
            <div key={p.id} style={{ position:"relative", borderRadius:10, overflow:"hidden", border:"2px solid var(--border-color)", aspectRatio:"3/4", background:"var(--bg-chip)" }}>
              <img src={p.enhanced||p.uri} alt={`Page ${i+1}`}
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(0,0,0,.65)", padding:"4px 6px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>p.{i+1}</span>
                <button onClick={()=>setPages(prev=>prev.filter(x=>x.id!==p.id))}
                  style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.8)",display:"flex",padding:0 }}>
                  <Ic d={IC.x} size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding:"12px 16px", background:"var(--bg-nav)", borderTop:"1px solid var(--border-color)", display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={doOCR} style={{ flex:1,padding:12,borderRadius:14,border:"1px solid var(--border-color)",background:"var(--bg-card)",color:"var(--text-primary)",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            <Ic d={IC.text} size={18} /> {ocrLoading ? "Running OCR…" : "Extract Text (OCR)"}
          </button>
          <button onClick={async()=>{const uri=await buildPDF();onInsertToNote(pages,uri);}} style={{ flex:1,padding:12,borderRadius:14,border:"none",background:"#9f1239",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            <Ic d={IC.note} size={18} /> Insert to Note
          </button>
        </div>
        <button onClick={async()=>{
          const uri=await buildPDF();
          const a=document.createElement("a");
          a.href=uri; a.download=`${pdfName}.pdf`; a.click();
        }} style={{ width:"100%",padding:12,borderRadius:14,border:"none",background:"var(--bg-chip)",color:"var(--text-primary)",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
          <Ic d={IC.down} size={18} /> Download as PDF
        </button>
      </div>
    </div>
  );

  // PHASE: ocr result
  if (phase === "ocr") return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", color:"var(--text-primary)", display:"flex", flexDirection:"column" }}>
      <header style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--bg-header)", borderBottom:"1px solid var(--border-color)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
        <button onClick={()=>setPhase("pages")} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-primary)",display:"flex",padding:4 }}><Ic d={IC.back} size={22} /></button>
        <strong style={{ flex:1, fontFamily:"Manrope,sans-serif", fontSize:16, fontWeight:800 }}>Extracted Text</strong>
        <button onClick={()=>navigator.clipboard?.writeText(ocrText)} style={{ background:"none",border:"none",cursor:"pointer",color:"#9f1239",display:"flex",padding:4 }}><Ic d={IC.copy} size={18} /></button>
      </header>

      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        {ocrText ? (
          <pre style={{ margin:0, fontFamily:"DM Sans,sans-serif", fontSize:14, lineHeight:1.7, color:"var(--text-primary)", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{ocrText}</pre>
        ) : (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)" }}>
            <p>No text was detected. Try the Black & White enhancement mode for better OCR results.</p>
          </div>
        )}
      </div>

      {ocrText && (
        <div style={{ padding:"12px 16px", background:"var(--bg-nav)", borderTop:"1px solid var(--border-color)", display:"flex", gap:10 }}>
          <button onClick={()=>navigator.clipboard?.writeText(ocrText)} style={{ flex:1,padding:12,borderRadius:14,border:"1px solid var(--border-color)",background:"var(--bg-card)",color:"var(--text-primary)",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            <Ic d={IC.copy} size={16} /> Copy All
          </button>
          <button onClick={()=>{onInsertToNote(pages);}} style={{ flex:1,padding:12,borderRadius:14,border:"none",background:"#9f1239",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            <Ic d={IC.note} size={16} /> Insert to Note
          </button>
        </div>
      )}
    </div>
  );

  return null;
}
