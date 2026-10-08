import { useState, useMemo } from "react";
import { type UploadFile } from "../App";
import { type ViewableFile } from "./FileViewer";

// ─── ICON COMPONENT ───────────────────────────────────────────────────────────
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
  upload: "M12 16V4M7 9l5-5 5 5M5 14v6h14v-6",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0",
  x: "M18 6 6 18M6 6l12 12",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  copy: "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1",
  down: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  img: "M15 8h.01M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM3 16l5-5 5 5 4-4 4 4",
  vid: "M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.89L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
};

// ─── FILE STYLING ─────────────────────────────────────────────────────────────
function getFileStyle(type: string, name: string) {
  if (type.startsWith("image/")) return { color: "#087f80", bg: "rgba(8,127,128,.15)", d: IC.img };
  if (type.startsWith("video/")) return { color: "#87568d", bg: "rgba(135,86,141,.15)", d: IC.vid };
  if (type === "application/pdf" || /\.pdf$/i.test(name)) return { color: "#b2213d", bg: "rgba(178,33,61,.15)", d: IC.file };
  if (/\.(doc|docx)$/i.test(name)) return { color: "#2457b3", bg: "rgba(36,87,179,.15)", d: IC.file };
  if (/\.(xls|xlsx|csv)$/i.test(name)) return { color: "#1a7a45", bg: "rgba(26,122,69,.15)", d: IC.file };
  if (/\.(ppt|pptx)$/i.test(name)) return { color: "#c4500a", bg: "rgba(196,80,10,.15)", d: IC.file };
  return { color: "#6e6770", bg: "rgba(110,103,112,.15)", d: IC.file };
}

// ─── EXTENDED UPLOAD FILE ─────────────────────────────────────────────────────
export interface ExtFile extends UploadFile {
  isFavorite?: boolean;
  lastOpenedAt?: string;
}

// ─── FILE MANAGER ─────────────────────────────────────────────────────────────
export default function FileManager({
  files, onBack, onAddFiles, onDeleteFile, onRenameFile, onDuplicateFile, onToggleFavorite, onOpenViewer, onUpdateOpenedAt
}: {
  files: ExtFile[];
  onBack: () => void;
  onAddFiles: (files: UploadFile[]) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, name: string) => void;
  onDuplicateFile: (file: ExtFile) => void;
  onToggleFavorite: (id: string) => void;
  onOpenViewer: (file: ExtFile) => void;
  onUpdateOpenedAt: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Recent"|"Favorites"|"All"|"Images"|"Documents"|"Videos"|"PDF">("Recent");
  const [viewMode, setViewMode] = useState<"grid"|"list">("list");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // File Add
  function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const newFiles = Array.from(e.target.files).map(f => ({
      id: `f-${Date.now()}-${f.name}`,
      name: f.name,
      size: f.size > 1048576 ? `${(f.size/1048576).toFixed(1)} MB` : `${Math.round(f.size/1024)} KB`,
      type: f.type || "application/octet-stream",
      uri: URL.createObjectURL(f),
      addedAt: new Date().toISOString()
    }));
    onAddFiles(newFiles);
    e.target.value = "";
  }

  // Filtering Logic
  const filtered = useMemo(() => {
    let f = files;
    if (query) {
      const q = query.toLowerCase();
      f = f.filter(x => x.name.toLowerCase().includes(q));
    }
    switch (filter) {
      case "Recent":
        f = f.slice().sort((a,b) => new Date(b.lastOpenedAt || b.addedAt).getTime() - new Date(a.lastOpenedAt || a.addedAt).getTime());
        break;
      case "Favorites":
        f = f.filter(x => x.isFavorite);
        break;
      case "Images":
        f = f.filter(x => x.type.startsWith("image/"));
        break;
      case "Videos":
        f = f.filter(x => x.type.startsWith("video/"));
        break;
      case "PDF":
        f = f.filter(x => x.type === "application/pdf" || x.name.endsWith(".pdf"));
        break;
      case "Documents":
        f = f.filter(x => x.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt)$/i));
        break;
      default:
        f = f.slice().sort((a,b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
    }
    return f;
  }, [files, query, filter]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      
      {/* ── HEADER ── */}
      <header style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--bg-header)", borderBottom:"1px solid var(--border-color)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-primary)", padding:4 }}><Ic d={IC.back} size={22} /></button>
        <h1 style={{ flex:1, margin:0, fontSize:18, fontWeight:800, fontFamily:"Manrope,sans-serif" }}>Files</h1>
        <button onClick={()=>setViewMode(v => v==="grid"?"list":"grid")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-secondary)", padding:4 }}>
          <Ic d={viewMode==="grid"?IC.list:IC.grid} size={20} />
        </button>
      </header>

      <div style={{ padding: 16, flex:1, display:"flex", flexDirection:"column" }}>

        {/* ── SEARCH ── */}
        <label style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg-input)", borderRadius:14, padding:"0 14px", height:46, border:"1px solid var(--border-color)", marginBottom:16, boxShadow:"var(--shadow-card)" }}>
          <Ic d={IC.search} size={18} />
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search files, documents, images…"
            style={{ flex:1, border:"none", outline:"none", fontSize:14, background:"transparent", color:"var(--text-primary)" }} />
          {query && <button onClick={()=>setQuery("")} style={{ background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",padding:4 }}><Ic d={IC.x} size={16} /></button>}
        </label>

        {/* ── CATEGORIES ── */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", scrollbarWidth:"none", paddingBottom:4, marginBottom:16 }}>
          {(["Recent","Favorites","All","Images","PDF","Documents","Videos"] as const).map(cat => (
            <button key={cat} onClick={()=>setFilter(cat)}
              style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:20,
                border: filter===cat ? "none" : "1px solid var(--border-color)", cursor:"pointer",
                fontSize:13, fontWeight:700, fontFamily:"Manrope,sans-serif", whiteSpace:"nowrap",
                background: filter===cat ? "#9f1239" : "var(--bg-chip)",
                color: filter===cat ? "#fff" : "var(--text-secondary)",
                transition: "all .15s"
              }}>
              {cat==="Recent" && <Ic d={IC.clock} size={14} sw={2.5}/>}
              {cat==="Favorites" && <Ic d={IC.star} size={14} sw={2.5} />}
              {cat}
            </button>
          ))}
        </div>

        {/* ── UPLOAD BUTTON ── */}
        <label style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"16px",
          background:"var(--bg-card)", border:"2px dashed var(--border-color)", borderRadius:16, cursor:"pointer",
          marginBottom:24, color:"var(--text-secondary)", fontWeight:700, fontSize:14, fontFamily:"Manrope,sans-serif"
        }}>
          <Ic d={IC.upload} size={22} /> Add Files
          <input type="file" multiple style={{ display:"none" }} onChange={handleAdd} />
        </label>

        {/* ── FILE LIST / GRID ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"var(--text-muted)", fontSize:14 }}>
            {query ? `No results for "${query}"` : filter==="Favorites" ? "No favorite files." : filter==="Recent" ? "No recent files." : "No files here yet."}
          </div>
        ) : viewMode === "list" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {filtered.map(f => {
              const style = getFileStyle(f.type, f.name);
              return (
                <div key={f.id} style={{ position:"relative", display:"flex", alignItems:"center", gap:12, padding:"12px", background:"var(--bg-card)", borderRadius:14, border:"1px solid var(--border-subtle)", boxShadow:"var(--shadow-card)" }}>
                  <div onClick={()=>{ onUpdateOpenedAt(f.id); onOpenViewer(f); }} style={{ display:"flex", alignItems:"center", justifyContent:"center", width:44, height:44, borderRadius:12, background:style.bg, color:style.color, flexShrink:0, cursor:"pointer" }}>
                    <Ic d={style.d} size={24} />
                  </div>
                  <div onClick={()=>{ onUpdateOpenedAt(f.id); onOpenViewer(f); }} style={{ flex:1, minWidth:0, cursor:"pointer" }}>
                    <h3 style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, fontFamily:"Manrope,sans-serif", color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {f.name}
                    </h3>
                    <div style={{ fontSize:11, color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:6 }}>
                      <span>{f.size}</span>
                      {f.isFavorite && <span style={{ color:"#eab308" }}>★</span>}
                    </div>
                  </div>
                  <button onClick={()=>setActiveMenuId(activeMenuId===f.id ? null : f.id)} style={{ background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",padding:6 }}>
                    <Ic d={IC.more} size={20} />
                  </button>
                  {/* Dropdown Menu */}
                  {activeMenuId === f.id && (
                    <div style={{ position:"absolute", right:12, top:46, zIndex:20, width:180, background:"var(--bg-card)", borderRadius:12, padding:6, boxShadow:"0 8px 30px rgba(0,0,0,.15)", border:"1px solid var(--border-color)" }}>
                      <MenuBtn icon={IC.star} label={f.isFavorite?"Unfavorite":"Favorite"} onClick={()=>{onToggleFavorite(f.id); setActiveMenuId(null);}} />
                      <MenuBtn icon={IC.edit} label="Rename" onClick={()=>{
                        const n = prompt("New name:", f.name);
                        if(n && n.trim()) onRenameFile(f.id, n.trim());
                        setActiveMenuId(null);
                      }} />
                      <MenuBtn icon={IC.copy} label="Duplicate" onClick={()=>{ onDuplicateFile(f); setActiveMenuId(null); }} />
                      <MenuBtn icon={IC.down} label="Download" onClick={()=>{
                        const a = document.createElement("a"); a.href=f.uri; a.download=f.name; a.click(); setActiveMenuId(null);
                      }} />
                      <div style={{ height:1, background:"var(--border-color)", margin:"4px 0" }}/>
                      <MenuBtn icon={IC.trash} label="Delete" color="#dc2626" onClick={()=>{onDeleteFile(f.id); setActiveMenuId(null);}} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px, 1fr))", gap:12 }}>
            {filtered.map(f => {
              const style = getFileStyle(f.type, f.name);
              const isImg = f.type.startsWith("image/");
              return (
                <div key={f.id} style={{ position:"relative", display:"flex", flexDirection:"column", background:"var(--bg-card)", borderRadius:14, border:"1px solid var(--border-subtle)", boxShadow:"var(--shadow-card)", overflow:"hidden" }}>
                  <div onClick={()=>{ onUpdateOpenedAt(f.id); onOpenViewer(f); }} style={{ height:90, background:"var(--bg-chip)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
                    {isImg ? (
                      <img src={f.uri} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    ) : (
                      <div style={{ color:style.color, background:style.bg, padding:12, borderRadius:12 }}><Ic d={style.d} size={32} /></div>
                    )}
                    {f.isFavorite && <div style={{ position:"absolute", top:6, left:6, color:"#eab308", background:"rgba(0,0,0,.5)", borderRadius:20, padding:"2px 4px", fontSize:10 }}>★</div>}
                  </div>
                  <div style={{ padding:"8px 10px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:4 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, fontFamily:"Manrope,sans-serif", color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.name}</div>
                      <div style={{ fontSize:9, color:"var(--text-secondary)" }}>{f.size}</div>
                    </div>
                    <button onClick={()=>setActiveMenuId(activeMenuId===f.id ? null : f.id)} style={{ background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",padding:0 }}>
                      <Ic d={IC.more} size={16} />
                    </button>
                  </div>
                  {/* Dropdown Menu (Grid) */}
                  {activeMenuId === f.id && (
                    <div style={{ position:"absolute", right:4, top:90, zIndex:20, width:140, background:"var(--bg-card)", borderRadius:12, padding:6, boxShadow:"0 8px 30px rgba(0,0,0,.25)", border:"1px solid var(--border-color)" }}>
                      <MenuBtn icon={IC.star} label={f.isFavorite?"Unfavorite":"Fav"} onClick={()=>{onToggleFavorite(f.id); setActiveMenuId(null);}} />
                      <MenuBtn icon={IC.trash} label="Delete" color="#dc2626" onClick={()=>{onDeleteFile(f.id); setActiveMenuId(null);}} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

function MenuBtn({ icon, label, onClick, color="var(--text-primary)" }: { icon: string; label: string; onClick: ()=>void; color?: string; }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 12px", background:"none", border:"none", cursor:"pointer", color, fontSize:13, fontWeight:600, fontFamily:"Manrope,sans-serif", borderRadius:8 }}>
      <Ic d={icon} size={16} /> {label}
    </button>
  );
}
