import { useState, useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";

// ── TYPES ──────────────────────────────────────────────────────────────────────
export interface NoteAttachment {
  id: string; name: string; type: string; size: string; uri: string; addedAt: string;
}
export interface NoteBlock {
  id: string; type: "text" | "image" | "video" | "attachment";
  html?: string; src?: string; attachment?: NoteAttachment;
}
export interface Note {
  id: string; title: string; tags: string[]; blocks: NoteBlock[];
  createdAt: string; updatedAt: string;
}

// ── TINY SVG ICON ─────────────────────────────────────────────────────────────
function Ic({ d, size = 18, sw = 1.8 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const IC = {
  back: "M15 18l-6-6 6-6",
  bold: "M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z",
  italic: "M19 4h-9M14 20H5M15 4 9 20",
  under: "M6 3v7a6 6 0 0 0 12 0V3M4 21h16",
  strike: "M18 6C18 3.8 16.2 2 14 2h-1.5a3.5 3.5 0 0 0 0 7h3a3.5 3.5 0 0 1 0 7H10c-2.2 0-4-1.8-4-4M5 12h14",
  ul: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  ol: "M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2",
  check: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  quote: "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  aL: "M3 6h18M3 12h12M3 18h18",
  aC: "M3 6h18M6 12h12M3 18h18",
  aR: "M3 6h18M9 12h12M3 18h18",
  ind: "M3 6h18M3 12h10M3 18h18M21 12l-4-4v8z",
  out: "M3 6h18M3 12h10M3 18h18M17 12l4-4v8z",
  undo: "M3 7v6h6M3 13A9 9 0 1 0 5.27 5.27",
  redo: "M21 7v6h-6M21 13A9 9 0 1 1 18.73 5.27",
  img: "M15 8h.01M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM3 16l5-5 5 5 4-4 4 4",
  vid: "M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.89L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  clip: "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",
  cam: "M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3zM9 13a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  x: "M18 6 6 18M6 6l12 12",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
};

function TBtn({
  d, label, active, onMD, style: s
}: {
  d: string; label?: string; active?: boolean;
  onMD: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}) {
  return (
    <button type="button" onMouseDown={onMD}
      style={{
        minWidth: label ? "auto" : 34, height: 34, padding: label ? "0 9px" : 0,
        border: `1px solid ${active ? "#9f1239" : "var(--border-color)"}`,
        borderRadius: 8, flexShrink: 0,
        background: active ? "rgba(159,18,57,0.1)" : "var(--bg-card)",
        color: active ? "#9f1239" : "var(--text-primary)",
        cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 4,
        fontSize: 11, fontWeight: 800, fontFamily: "Manrope,sans-serif",
        transition: "all 0.12s", ...s,
      }}>
      {label ? label : <Ic d={d} size={16} />}
    </button>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmtBytes(b: number) {
  return b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
}
function fileStyle(type: string, name: string) {
  if (type.startsWith("image/")) return { color: "#087f80", bg: "rgba(8,127,128,.14)", d: IC.img };
  if (type.startsWith("video/")) return { color: "#87568d", bg: "rgba(135,86,141,.14)", d: IC.vid };
  if (type === "application/pdf" || /\.pdf$/i.test(name)) return { color: "#b2213d", bg: "rgba(178,33,61,.14)", d: IC.file };
  if (/\.(doc|docx)$/i.test(name)) return { color: "#2457b3", bg: "rgba(36,87,179,.14)", d: IC.file };
  if (/\.(xls|xlsx|csv)$/i.test(name)) return { color: "#1a7a45", bg: "rgba(26,122,69,.14)", d: IC.file };
  if (/\.(ppt|pptx)$/i.test(name)) return { color: "#c4500a", bg: "rgba(196,80,10,.14)", d: IC.file };
  return { color: "#6e6770", bg: "rgba(110,103,112,.14)", d: IC.file };
}

async function doOCR(uri: string): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const w = await createWorker("eng");
    const { data } = await w.recognize(uri);
    await w.terminate();
    return data.text.trim();
  } catch { return ""; }
}

// ── LINK DIALOG ───────────────────────────────────────────────────────────────
function LinkDialog({ onOK, onCancel }: { onOK(url: string, txt: string): void; onCancel(): void }) {
  const [url, setUrl] = useState("https://");
  const [txt, setTxt] = useState("");
  return (
    <div style={{ position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={onCancel}>
      <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.55)" }} />
      <div onClick={e => e.stopPropagation()} style={{ position:"relative",zIndex:1,background:"var(--bg-card)",borderRadius:20,padding:24,width:"88%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,.4)" }}>
        <strong style={{ display:"block",fontFamily:"Manrope,sans-serif",fontSize:16,fontWeight:800,marginBottom:14,color:"var(--text-primary)" }}>Insert Link</strong>
        {[{ ph:"Display text (optional)", v:txt, set:setTxt },
          { ph:"https://…", v:url, set:setUrl }].map((f,i) => (
          <input key={i} value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph}
            style={{ width:"100%",border:"1px solid var(--border-color)",borderRadius:10,padding:"9px 12px",
              fontSize:13,outline:"none",marginBottom:10,boxSizing:"border-box" as const,
              background:"var(--bg-input)",color:"var(--text-primary)",fontFamily:"inherit" }} />
        ))}
        <div style={{ display:"flex",gap:10,marginTop:4 }}>
          <button onClick={onCancel} style={{ flex:1,padding:12,border:"1px solid var(--border-color)",borderRadius:12,background:"var(--bg-card)",color:"var(--text-primary)",fontWeight:700,cursor:"pointer" }}>Cancel</button>
          <button onClick={() => onOK(url,txt)} style={{ flex:1,padding:12,border:"none",borderRadius:12,background:"#9f1239",color:"#fff",fontWeight:700,cursor:"pointer" }}>Insert</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN EDITOR ───────────────────────────────────────────────────────────────
export default function NoteEditor({ note, onSave, onBack, onOpenScanner, onOpenViewer }: {
  note: Note;
  onSave(n: Note): void;
  onBack(): void;
  onOpenScanner(): void;
  onOpenViewer(a: NoteAttachment): void;
}) {
  const [title, setTitle]         = useState(note.title);
  const [tags, setTags]           = useState<string[]>(note.tags || []);
  const [tagInput, setTagInput]   = useState("");
  const [blocks, setBlocks]       = useState<NoteBlock[]>(
    note.blocks?.length ? note.blocks : [{ id:"b1", type:"text", html:"" }]
  );
  const [saved, setSaved]         = useState(true);
  const [showLink, setShowLink]   = useState(false);
  const [moreOpen, setMoreOpen]   = useState(false);
  const [ocrLoad, setOcrLoad]     = useState<string|null>(null);
  const [ocrResult, setOcrResult] = useState<{id:string;text:string}|null>(null);
  const [fmts, setFmts]           = useState<Record<string,boolean>>({});

  const edRef   = useRef<HTMLDivElement>(null);
  const timer   = useRef<ReturnType<typeof setTimeout>|null>(null);
  const counter = useRef(Date.now());
  const uid = () => `b${counter.current++}`;

  // Seed editor HTML on note change
  useEffect(() => {
    if (!edRef.current) return;
    const html = blocks.filter(b => b.type === "text").map(b => b.html || "").join("");
    edRef.current.innerHTML = html;
    const r = document.createRange(), s = window.getSelection();
    r.selectNodeContents(edRef.current); r.collapse(false);
    s?.removeAllRanges(); s?.addRange(r);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  // Auto-save
  function touch(t=title, tg=tags, bl=blocks) {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const html = edRef.current?.innerHTML || "";
      const updated: NoteBlock[] = [
        { id: bl.find(b=>b.type==="text")?.id || "b1", type:"text", html },
        ...bl.filter(b => b.type !== "text"),
      ];
      onSave({ ...note, title:t, tags:tg, blocks:updated, updatedAt:new Date().toISOString() });
      setSaved(true);
    }, 600);
  }

  // Update active format indicators
  function syncFmts() {
    setFmts({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strike: document.queryCommandState("strikeThrough"),
    });
  }

  // Execute formatting commands
  const exec = useCallback((cmd: string, val?: string) => {
    const el = edRef.current; if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel?.rangeCount || !el.contains(sel.anchorNode)) {
      const r = document.createRange();
      r.selectNodeContents(el); r.collapse(false);
      sel?.removeAllRanges(); sel?.addRange(r);
    }
    switch (cmd) {
      case "formatBlock":
        document.execCommand("formatBlock", false, val || "p");
        break;
      case "insertHTML":
        document.execCommand("insertHTML", false, val);
        break;
      case "insertUnorderedList": {
        // Check if we're already in a UL — if so, outdent/remove
        const anc = sel?.anchorNode;
        const li = anc ? (anc.nodeType === 3 ? anc.parentElement : anc as Element)?.closest?.('li') : null;
        if (li?.closest?.('ul')) {
          document.execCommand("insertUnorderedList", false);
        } else {
          document.execCommand("insertHTML", false,
            `<ul style="list-style-type:disc;padding-left:24px;margin:.4em 0"><li style="margin-bottom:4px">List item</li></ul><p><br></p>`);
        }
        break;
      }
      case "insertOrderedList": {
        const anc2 = sel?.anchorNode;
        const li2 = anc2 ? (anc2.nodeType === 3 ? anc2.parentElement : anc2 as Element)?.closest?.('li') : null;
        if (li2?.closest?.('ol')) {
          document.execCommand("insertOrderedList", false);
        } else {
          document.execCommand("insertHTML", false,
            `<ol style="list-style-type:decimal;padding-left:24px;margin:.4em 0"><li style="margin-bottom:4px">List item</li></ol><p><br></p>`);
        }
        break;
      }
      case "insertChecklist":
        document.execCommand("insertHTML", false,
          `<ul style="list-style:none;padding-left:4px;margin:.4em 0"><li style="display:flex;align-items:flex-start;gap:8px;margin-bottom:4px"><input type="checkbox" style="width:16px;height:16px;margin-top:2px;cursor:pointer;accent-color:#9f1239;flex-shrink:0"/><span>To-do item</span></li></ul>`);
        break;
      default:
        document.execCommand(cmd, false, val);
    }
    syncFmts(); touch();
  }, []);

  // Media / attachment blocks
  function addImage(file: File)  { setBlocks(b=>[...b,{id:uid(),type:"image",src:URL.createObjectURL(file)}]); touch(); }
  function addVideo(file: File)  { setBlocks(b=>[...b,{id:uid(),type:"video",src:URL.createObjectURL(file)}]); touch(); }
  function addFile(file: File) {
    if (file.type.startsWith("image/")) { addImage(file); return; }
    if (file.type.startsWith("video/")) { addVideo(file); return; }
    const att: NoteAttachment = { id:uid(), name:file.name, type:file.type||"application/octet-stream", size:fmtBytes(file.size), uri:URL.createObjectURL(file), addedAt:new Date().toISOString() };
    setBlocks(b=>[...b,{id:uid(),type:"attachment",attachment:att}]);
    touch();
  }
  function rmBlock(id: string) { setBlocks(b=>b.filter(x=>x.id!==id)); touch(); }

  // OCR
  async function triggerOCR(id: string, src: string) {
    setOcrLoad(id);
    const text = await doOCR(src);
    setOcrLoad(null);
    if (text) setOcrResult({ id, text });
    else alert("No text detected.");
  }
  function insertOCR() {
    if (!ocrResult) return;
    edRef.current?.focus();
    document.execCommand("insertText", false, "\n\n" + ocrResult.text);
    setOcrResult(null); touch();
  }

  // Tags
  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key==="Enter"||e.key===",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,/g,"");
      if (t && !tags.includes(t)) { const nt=[...tags,t]; setTags(nt); touch(title,nt,blocks); }
      setTagInput("");
    }
  }
  function rmTag(t: string) { const nt=tags.filter(x=>x!==t); setTags(nt); touch(title,nt,blocks); }

  // Link insert
  function onLinkOK(url: string, txt: string) {
    setShowLink(false);
    const el = edRef.current; if (!el) return;
    el.focus();
    const html = txt
      ? `<a href="${url}" target="_blank" style="color:#3ddbd9;text-decoration:underline">${txt}</a>`
      : `<a href="${url}" target="_blank" style="color:#3ddbd9;text-decoration:underline">${url}</a>`;
    document.execCommand("insertHTML", false, html);
    touch();
  }

  const sep = <div style={{ width:1, background:"var(--border-color)", margin:"3px 2px", flexShrink:0 }} />;
  const md = (fn: ()=>void) => (e: React.MouseEvent) => { e.preventDefault(); fn(); };

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"var(--note-bg)", color:"var(--text-primary)" }}>

      {/* ─ TOP BAR ─ */}
      <header style={{ position:"sticky", top:0, zIndex:60, display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"var(--bg-header)", borderBottom:"1px solid var(--border-color)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-primary)", display:"flex", padding:"4px 6px 4px 0" }}>
          <Ic d={IC.back} size={22} />
        </button>
        <input value={title} onChange={e=>{setTitle(e.target.value);touch(e.target.value,tags,blocks);}}
          placeholder="Note title…"
          style={{ flex:1, border:"none", outline:"none", fontSize:17, fontWeight:800, fontFamily:"Manrope,sans-serif", background:"transparent", color:"var(--text-primary)", letterSpacing:-0.3 }} />
        <span style={{ fontSize:11, color:saved?"#4caf50":"#ff9800", fontWeight:700, fontFamily:"Manrope,sans-serif", whiteSpace:"nowrap" }}>
          {saved ? "✓ Saved" : "Saving…"}
        </span>
      </header>

      {/* ─ FORMATTING TOOLBAR ─ */}
      <div style={{ position:"sticky", top:53, zIndex:50, background:"var(--bg-header)", borderBottom:"1px solid var(--border-color)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", gap:4, padding:"5px 8px", overflowX:"auto", scrollbarWidth:"none", alignItems:"center" }}>
          {/* Undo / Redo */}
          <TBtn d={IC.undo} onMD={md(()=>exec("undo"))} />
          <TBtn d={IC.redo} onMD={md(()=>exec("redo"))} />
          {sep}
          {/* Inline formatting */}
          <TBtn d={IC.bold}   active={fmts.bold}    onMD={md(()=>exec("bold"))} />
          <TBtn d={IC.italic} active={fmts.italic}  onMD={md(()=>exec("italic"))} />
          <TBtn d={IC.under}  active={fmts.underline} onMD={md(()=>exec("underline"))} />
          <TBtn d={IC.strike} active={fmts.strike}   onMD={md(()=>exec("strikeThrough"))} />
          {sep}
          {/* Block headings */}
          <TBtn d="" label="H1" onMD={md(()=>exec("formatBlock","h1"))} />
          <TBtn d="" label="H2" onMD={md(()=>exec("formatBlock","h2"))} />
          <TBtn d="" label="H3" onMD={md(()=>exec("formatBlock","h3"))} />
          <TBtn d="" label="¶"  onMD={md(()=>exec("formatBlock","p"))} style={{ color:"var(--text-secondary)" }} />
          {sep}
          {/* Lists */}
          <TBtn d={IC.ul}    onMD={md(()=>exec("insertUnorderedList"))} />
          <TBtn d={IC.ol}    onMD={md(()=>exec("insertOrderedList"))} />
          <TBtn d={IC.check} onMD={md(()=>exec("insertChecklist"))} />
          {sep}
          {/* Semantic blocks */}
          <TBtn d={IC.quote} onMD={md(()=>exec("formatBlock","blockquote"))} />
          <TBtn d={IC.code}  onMD={md(()=>exec("formatBlock","pre"))} />
          <TBtn d={IC.link}  onMD={md(()=>setShowLink(true))} />
          {sep}
          {/* Alignment */}
          <TBtn d={IC.aL} onMD={md(()=>exec("justifyLeft"))} />
          <TBtn d={IC.aC} onMD={md(()=>exec("justifyCenter"))} />
          <TBtn d={IC.aR} onMD={md(()=>exec("justifyRight"))} />
          {sep}
          {/* Indent */}
          <TBtn d={IC.ind} onMD={md(()=>exec("indent"))} />
          <TBtn d={IC.out} onMD={md(()=>exec("outdent"))} />
        </div>
      </div>

      {/* ─ CONTENT ─ */}
      <div style={{ flex:1, padding:"16px 16px 160px" }}>

        {/* Tags row */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16, alignItems:"center" }}>
          {tags.map(t => (
            <span key={t} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, background:"#9f1239", color:"#fff", fontSize:12, fontWeight:700, fontFamily:"Manrope,sans-serif" }}>
              <Ic d={IC.tag} size={11} sw={2} /> {t}
              <button onClick={()=>rmTag(t)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.85)",display:"flex",padding:0 }}>
                <Ic d={IC.x} size={11} />
              </button>
            </span>
          ))}
          <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={onTagKey}
            placeholder="+ Add tag…"
            style={{ border:"1px dashed var(--border-color)", borderRadius:20, padding:"4px 12px", fontSize:12, outline:"none", background:"var(--bg-card)", color:"var(--text-primary)", minWidth:110, fontFamily:"inherit" }} />
        </div>

        {/* ─ RICH TEXT EDITOR ─ */}
        <div ref={edRef} contentEditable suppressContentEditableWarning dir="ltr"
          onInput={() => { syncFmts(); touch(); }}
          onKeyUp={syncFmts} onMouseUp={syncFmts}
          data-ph="Start writing your note…"
          className="ownly-editor" />

        {/* ─ MEDIA & ATTACHMENT BLOCKS ─ */}
        {blocks.filter(b=>b.type!=="text").map(block => {
          if (block.type === "image" && block.src) return (
            <div key={block.id} style={{ margin:"16px 0", position:"relative", borderRadius:14, overflow:"hidden", border:"1px solid var(--border-color)" }}>
              <img src={block.src} alt="" style={{ width:"100%", display:"block" }} />
              <div style={{ position:"absolute", top:8, right:8, display:"flex", gap:6 }}>
                {ocrLoad === block.id
                  ? <span style={{ background:"rgba(0,0,0,.75)", borderRadius:20, padding:"4px 12px", color:"#fff", fontSize:11, fontWeight:700 }}>OCR…</span>
                  : <button onClick={()=>triggerOCR(block.id, block.src!)} style={{ background:"rgba(0,0,0,.75)", border:"none", borderRadius:20, padding:"4px 12px", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>OCR</button>
                }
                <button onClick={()=>rmBlock(block.id)} style={{ background:"rgba(0,0,0,.75)", border:"none", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
                  <Ic d={IC.x} size={14} />
                </button>
              </div>
            </div>
          );
          if (block.type === "video" && block.src) return (
            <div key={block.id} style={{ margin:"16px 0", position:"relative", borderRadius:14, overflow:"hidden", border:"1px solid var(--border-color)" }}>
              <video src={block.src} controls style={{ width:"100%", display:"block" }} />
              <button onClick={()=>rmBlock(block.id)} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,.75)", border:"none", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff" }}>
                <Ic d={IC.x} size={14} />
              </button>
            </div>
          );
          if (block.type === "attachment" && block.attachment) {
            const a = block.attachment, s = fileStyle(a.type, a.name);
            return (
              <div key={block.id} onClick={()=>onOpenViewer(a)}
                style={{ margin:"12px 0", display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"var(--bg-card)", borderRadius:14, border:"1px solid var(--border-subtle)", cursor:"pointer", transition:"transform .12s" }}>
                <span style={{ width:42, height:42, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", background:s.bg, color:s.color, flexShrink:0 }}>
                  <Ic d={s.d} size={22} />
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <strong style={{ display:"block", fontSize:13, fontWeight:700, fontFamily:"Manrope,sans-serif", color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</strong>
                  <small style={{ color:"var(--text-secondary)", fontSize:11 }}>{a.size} · Tap to open</small>
                </div>
                <button onClick={e=>{e.stopPropagation();rmBlock(block.id);}} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:4 }}>
                  <Ic d={IC.trash} size={15} />
                </button>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* ─ OCR RESULT PANEL ─ */}
      {ocrResult && (
        <div style={{ position:"fixed", bottom:76, left:16, right:16, zIndex:300, background:"var(--bg-card)", borderRadius:18, padding:16, boxShadow:"0 10px 40px rgba(0,0,0,.35)", border:"1px solid var(--border-color)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <strong style={{ fontSize:13, fontWeight:800, fontFamily:"Manrope,sans-serif", color:"var(--text-primary)" }}>Extracted Text (OCR)</strong>
            <button onClick={()=>setOcrResult(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)" }}><Ic d={IC.x} size={16} /></button>
          </div>
          <p style={{ margin:"0 0 12px", fontSize:12, color:"var(--text-secondary)", lineHeight:1.6, maxHeight:90, overflow:"auto" }}>{ocrResult.text.slice(0,300)}{ocrResult.text.length>300?"…":""}</p>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={insertOCR} style={{ flex:1,padding:"8px 12px",background:"#9f1239",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:12,cursor:"pointer" }}>Insert into Note</button>
            <button onClick={()=>navigator.clipboard?.writeText(ocrResult!.text)} style={{ flex:1,padding:"8px 12px",background:"var(--bg-chip)",color:"var(--text-primary)",border:"1px solid var(--border-color)",borderRadius:10,fontWeight:700,fontSize:12,cursor:"pointer" }}>Copy</button>
          </div>
        </div>
      )}

      {/* ─ BOTTOM ACTIONS ─ */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:"var(--bg-nav)", borderTop:"1px solid var(--border-color)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", padding:"7px 10px calc(7px + env(safe-area-inset-bottom))" }}>
        <div style={{ display:"flex", gap:7, overflowX:"auto", scrollbarWidth:"none" }}>
          <label style={btnWrap("#087f80")}>
            <Ic d={IC.img} size={20} /><span>Photo</span>
            <input type="file" accept="image/*" style={{ display:"none" }} onChange={(e:ChangeEvent<HTMLInputElement>)=>e.target.files?.[0]&&addImage(e.target.files[0])} />
          </label>
          <label style={btnWrap("#87568d")}>
            <Ic d={IC.vid} size={20} /><span>Video</span>
            <input type="file" accept="video/*" style={{ display:"none" }} onChange={(e:ChangeEvent<HTMLInputElement>)=>e.target.files?.[0]&&addVideo(e.target.files[0])} />
          </label>
          <label style={btnWrap("#a66d00")}>
            <Ic d={IC.clip} size={20} /><span>File</span>
            <input type="file" multiple accept="*/*" style={{ display:"none" }} onChange={(e:ChangeEvent<HTMLInputElement>)=>Array.from(e.target.files||[]).forEach(addFile)} />
          </label>
          <button onClick={onOpenScanner} style={{ ...btnWrapB("#9f1239") }}>
            <Ic d={IC.cam} size={20} /><span>Scan</span>
          </button>
          <div style={{ flex:1 }} />
          <button onClick={()=>setMoreOpen(v=>!v)} style={{ ...btnWrapB("var(--text-secondary)") }}>
            <Ic d={IC.more} size={20} /><span>More</span>
          </button>
        </div>
        {moreOpen && (
          <div style={{ display:"flex", gap:7, paddingTop:8, marginTop:6, borderTop:"1px solid var(--border-color)", flexWrap:"wrap" }}>
            {[
              { label:"Divider", onMD:()=>exec("insertHTML",'<hr style="border:none;border-top:2px solid var(--border-color);margin:16px 0"/>') },
              { label:"Quote",   onMD:()=>exec("formatBlock","blockquote") },
              { label:"Code",    onMD:()=>exec("formatBlock","pre") },
              { label:"Center",  onMD:()=>exec("justifyCenter") },
              { label:"Checklist", onMD:()=>exec("insertChecklist") },
            ].map(x=>(
              <button key={x.label} onMouseDown={e=>{e.preventDefault();x.onMD();setMoreOpen(false);}}
                style={{ padding:"6px 13px", borderRadius:20, border:"1px solid var(--border-color)", background:"var(--bg-chip)", color:"var(--text-primary)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"Manrope,sans-serif" }}>
                {x.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showLink && <LinkDialog onOK={onLinkOK} onCancel={()=>setShowLink(false)} />}

      {/* ─ EDITOR STYLES ─ */}
      <style>{`
        .ownly-editor {
          min-height:220px; outline:none; font:15px/1.78 "DM Sans",sans-serif;
          color:var(--text-primary); direction:ltr; text-align:left; word-break:break-word;
          caret-color:#9f1239;
        }
        .ownly-editor:empty::before {
          content:attr(data-ph); color:var(--text-muted); pointer-events:none; font-style:italic;
        }
        .ownly-editor h1 { font:800 1.75rem/1.2 "Manrope",sans-serif; margin:.55em 0 .22em; color:var(--text-primary); letter-spacing:-.5px; }
        .ownly-editor h2 { font:700 1.4rem/1.3 "Manrope",sans-serif; margin:.5em 0 .2em; color:var(--text-primary); }
        .ownly-editor h3 { font:700 1.15rem/1.4 "Manrope",sans-serif; margin:.45em 0 .18em; color:var(--text-primary); }
        .ownly-editor p  { margin:.35em 0; }
        .ownly-editor blockquote { border-left:3px solid #9f1239; margin:.6em 0; padding:6px 14px; color:var(--text-secondary); font-style:italic; background:var(--bg-chip); border-radius:0 10px 10px 0; }
        .ownly-editor pre { background:var(--bg-chip); border:1px solid var(--border-color); border-radius:10px; padding:12px 14px; font:13px/1.5 "Courier New",monospace; overflow:auto; white-space:pre-wrap; color:var(--text-primary); margin:.5em 0; }
        /* Bullet & numbered list styles */
        .ownly-editor ul { list-style-type:disc !important; padding-left:26px !important; margin:.45em 0 !important; color:var(--text-primary); }
        .ownly-editor ol { list-style-type:decimal !important; padding-left:26px !important; margin:.45em 0 !important; color:var(--text-primary); }
        .ownly-editor ul li { display:list-item !important; list-style-type:disc !important; margin-bottom:4px; padding-left:2px; }
        .ownly-editor ol li { display:list-item !important; list-style-type:decimal !important; margin-bottom:4px; padding-left:2px; }
        .ownly-editor ul ul { list-style-type:circle !important; }
        .ownly-editor ol ol { list-style-type:lower-alpha !important; }
        .ownly-editor a { color:#3ddbd9; text-decoration:underline; }
        .ownly-editor b, .ownly-editor strong { font-weight:700; }
        .ownly-editor i, .ownly-editor em { font-style:italic; }
        .ownly-editor u { text-decoration:underline; }
        .ownly-editor s, .ownly-editor strike, .ownly-editor del { text-decoration:line-through; }
        .ownly-editor input[type="checkbox"] { width:16px;height:16px;cursor:pointer;accent-color:#9f1239; }
        html.dark-mode .ownly-editor { color:var(--text-primary); }
      `}</style>
    </div>
  );
}

// ─ STYLE HELPERS ──────────────────────────────────────────────────────────────
const btnWrap = (color: string): React.CSSProperties => ({
  display:"flex", flexDirection:"column", alignItems:"center", gap:3,
  padding:"5px 10px", borderRadius:10, background:"var(--bg-chip)",
  cursor:"pointer", fontSize:9, fontWeight:700, fontFamily:"Manrope,sans-serif",
  color, flexShrink:0,
});
const btnWrapB = (color: string): React.CSSProperties => ({
  ...btnWrap(color),
  border:"none", background: color==="var(--text-secondary)" ? "var(--bg-chip)" : "rgba(159,18,57,0.10)",
});
