import { useState, useEffect, useRef, ChangeEvent } from "react";

// ── TYPES ──────────────────────────────────────────────────────────────────────
export interface KnowledgeItem {
  id: string;
  type: "note" | "web" | "pdf" | "image" | "video" | "file" | "youtube" | "scan";
  title: string;
  url?: string;
  domain?: string;
  favicon?: string;
  description?: string;
  previewImage?: string;
  content?: string;
  tags?: string[];
  noteId?: string;
  addedAt: string;
  lastOpenedAt?: string;
  isFavorite?: boolean;
  fileSize?: string;
  uri?: string;
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
function uid() { return `k${Date.now()}${Math.random().toString(36).slice(2, 7)}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function extractDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}
function isYouTube(url: string) { return /youtube\.com|youtu\.be/.test(url); }
function isPDF(url: string) { return /\.pdf($|\?)/i.test(url); }
function getYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}
function getTypeIcon(type: KnowledgeItem["type"]) {
  const icons: Record<string, string> = { web: "🌐", youtube: "▶️", pdf: "📄", image: "🖼️", video: "🎬", file: "📁", note: "📓", scan: "📷" };
  return icons[type] || "🔗";
}
function getTypeColor(type: KnowledgeItem["type"]) {
  const colors: Record<string, string> = { web: "#0ea5e9", youtube: "#ef4444", pdf: "#b2213d", image: "#0d9488", video: "#7c3aed", file: "#a16207", note: "#9f1239", scan: "#0f766e" };
  return colors[type] || "#6b7280";
}

// ── SVG ICON ──────────────────────────────────────────────────────────────────
function Ic({ d, size = 18, sw = 1.8 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IC = {
  back:    "M15 18l-6-6 6-6",
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  plus:    "M12 5v14M5 12h14",
  x:       "M18 6 6 18M6 6l12 12",
  globe:   "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  ext:     "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
  clip:    "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",
  graph:   "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  grid:    "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list:    "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  more:    "M5 12h.01M12 12h.01M19 12h.01",
  chevR:   "M9 18l6-6-6-6",
};

// ── WEB VIEWER ────────────────────────────────────────────────────────────────
function WebViewer({ url, title, onBack, onSave }: {
  url: string; title: string;
  onBack(): void;
  onSave(u: string, t: string, d: string): void;
}) {
  const [cur, setCur] = useState(url);
  const [inp, setInp] = useState(url);
  const [loading, setLoading] = useState(true);
  const iRef = useRef<HTMLIFrameElement>(null);
  const ytId = isYouTube(cur) ? getYouTubeId(cur) : null;

  function go(u: string) {
    let n = u.trim();
    if (!/^https?:\/\//i.test(n)) n = "https://" + n;
    setCur(n); setInp(n); setLoading(true);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", background: "var(--bg-page)" }}>
      {/* Nav bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: "var(--bg-header)", borderBottom: "1px solid var(--border-color)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", display: "flex", padding: 6 }}>
          <Ic d={IC.back} size={20} />
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", background: "var(--bg-input)", borderRadius: 10, padding: "0 10px", border: "1px solid var(--border-color)", height: 36 }}>
          <Ic d={IC.globe} size={14} />
          <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && go(inp)}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-primary)", marginLeft: 6 }} />
        </div>
        <button onClick={() => { setLoading(true); if (iRef.current) iRef.current.src = cur; }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 6 }}>
          <Ic d={IC.refresh} size={18} />
        </button>
        <button onClick={() => window.open(cur, "_blank")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 6 }}>
          <Ic d={IC.ext} size={18} />
        </button>
      </div>

      {/* Save bar */}
      <div style={{ background: "rgba(159,18,57,0.08)", borderBottom: "1px solid rgba(159,18,57,0.15)", padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#9f1239", fontWeight: 700, fontFamily: "Manrope,sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
          {extractDomain(cur)}
        </span>
        <button
          onClick={() => onSave(cur, title || extractDomain(cur), extractDomain(cur))}
          style={{ background: "#9f1239", color: "#fff", border: "none", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Manrope,sans-serif", whiteSpace: "nowrap" }}>
          + Save to Knowledge
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)", zIndex: 1 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 36, height: 36, border: "3px solid rgba(159,18,57,0.2)", borderTopColor: "#9f1239", borderRadius: "50%", animation: "ck-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Loading…</p>
            </div>
          </div>
        )}
        {ytId ? (
          <iframe src={`https://www.youtube.com/embed/${ytId}`} style={{ width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen
            onLoad={() => setLoading(false)} />
        ) : (
          <iframe ref={iRef} src={cur} style={{ width: "100%", height: "100%", border: "none" }}
            onLoad={() => setLoading(false)} title={title}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
        )}
      </div>
      <style>{`@keyframes ck-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── ADD LINK DIALOG ───────────────────────────────────────────────────────────
function AddLinkDialog({ onAdd, onClose }: { onAdd(item: KnowledgeItem): void; onClose(): void }) {
  const [url, setUrl] = useState("https://");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");

  function handleAdd() {
    let u = url.trim();
    if (!u || u === "https://") return;
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    const domain = extractDomain(u);
    const type: KnowledgeItem["type"] = isYouTube(u) ? "youtube" : isPDF(u) ? "pdf" : "web";
    const ytId2 = type === "youtube" ? getYouTubeId(u) : null;
    onAdd({
      id: uid(), type,
      title: title.trim() || (type === "youtube" ? "YouTube Video" : domain),
      url: u, domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      description: type === "youtube" ? `YouTube · ${domain}` : `Saved from ${domain}`,
      previewImage: ytId2 ? `https://img.youtube.com/vi/${ytId2}/hqdefault.jpg` : undefined,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      addedAt: new Date().toISOString(),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "100%", background: "var(--bg-card)", borderRadius: "20px 20px 0 0", padding: "20px 18px 36px", boxShadow: "0 -20px 60px rgba(0,0,0,0.3)", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>
            🌐 Add to Knowledge Base
          </strong>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <Ic d={IC.x} size={20} />
          </button>
        </div>
        {[
          { label: "URL *", val: url, set: setUrl, ph: "https://example.com or youtube.com/watch?v=..." },
          { label: "Title (optional)", val: title, set: setTitle, ph: "Auto-detected from URL" },
          { label: "Tags (comma-separated)", val: tags, set: setTags, ph: "research, emtl, physics…" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4, fontFamily: "Manrope,sans-serif" }}>{f.label}</label>
            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              onKeyDown={e => e.key === "Enter" && f.val === url && handleAdd()}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: 13, background: "var(--bg-input)", color: "var(--text-primary)", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-chip)", color: "var(--text-primary)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleAdd} style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: "#9f1239", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "Manrope,sans-serif" }}>
            Add to Knowledge Base
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KNOWLEDGE CARD ────────────────────────────────────────────────────────────
function KnowledgeCard({ item, onOpen, onDelete, onToggleFav }: {
  item: KnowledgeItem;
  onOpen(i: KnowledgeItem): void;
  onDelete(id: string): void;
  onToggleFav(id: string): void;
}) {
  const [menu, setMenu] = useState(false);
  const color = getTypeColor(item.type);
  const emoji = getTypeIcon(item.type);
  const ytThumb = item.type === "youtube" && item.url ? `https://img.youtube.com/vi/${getYouTubeId(item.url)}/hqdefault.jpg` : null;

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 18, border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", overflow: "hidden", position: "relative" }}>
      {/* Preview */}
      {(item.previewImage || ytThumb) && (
        <div style={{ height: 110, overflow: "hidden", position: "relative", background: "#111" }}>
          <img src={item.previewImage || ytThumb!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {item.type === "youtube" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="white" width={16} height={16}><polygon points="5,3 19,12 5,21" /></svg>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "11px 13px" }}>
        {/* Badge row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, background: `${color}1a`, color, fontSize: 9, fontWeight: 800, fontFamily: "Manrope,sans-serif", padding: "2px 8px", borderRadius: 20 }}>
            {emoji} {item.type.toUpperCase()}
          </span>
          <div style={{ display: "flex", gap: 2 }}>
            <button onClick={() => onToggleFav(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 3, fontSize: 14, opacity: item.isFavorite ? 1 : 0.3 }}>⭐</button>
            <button onClick={() => setMenu(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 3 }}>
              <Ic d={IC.more} size={14} />
            </button>
          </div>
        </div>

        {/* Title & content */}
        <button onClick={() => onOpen(item)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <strong style={{ display: "block", fontFamily: "Manrope,sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
            {item.title || item.domain || "Untitled"}
          </strong>
          {item.domain && (
            <span style={{ fontSize: 10, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 3 }}>
              {item.favicon && <img src={item.favicon} alt="" width={11} height={11} style={{ borderRadius: 2 }} onError={e => (e.currentTarget.style.display = "none")} />}
              {item.domain}
            </span>
          )}
          {item.description && (
            <p style={{ margin: "5px 0 0", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
              {item.description}
            </p>
          )}
        </button>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 7 }}>
            {item.tags.map(t => <span key={t} style={{ padding: "2px 6px", borderRadius: 10, background: "rgba(159,18,57,0.12)", color: "#9f1239", fontSize: 9, fontWeight: 700 }}>#{t}</span>)}
          </div>
        )}

        <div style={{ marginTop: 7, fontSize: 9, color: "var(--text-muted)" }}>{fmtDate(item.addedAt)}</div>
      </div>

      {/* Context menu */}
      {menu && (
        <div style={{ position: "absolute", top: 36, right: 12, zIndex: 50, background: "var(--bg-card)", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", minWidth: 148, overflow: "hidden" }}>
          {[
            { l: "Open", fn: () => { onOpen(item); setMenu(false); } },
            item.url ? { l: "Open in browser", fn: () => { window.open(item.url, "_blank"); setMenu(false); } } : null,
            item.url ? { l: "Copy link", fn: () => { navigator.clipboard?.writeText(item.url!); setMenu(false); } } : null,
            { l: item.isFavorite ? "Unfavorite" : "Favorite ⭐", fn: () => { onToggleFav(item.id); setMenu(false); } },
            { l: "Delete", fn: () => { onDelete(item.id); setMenu(false); } },
          ].filter(Boolean).map((x: { l: string; fn: () => void } | null) => x && (
            <button key={x.l} onClick={x.fn}
              style={{ display: "block", width: "100%", padding: "10px 13px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, color: x.l === "Delete" ? "#ef4444" : "var(--text-primary)", fontFamily: "inherit" }}>
              {x.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── KNOWLEDGE GRAPH ───────────────────────────────────────────────────────────
function KnowledgeGraph({ items, onSelect }: { items: KnowledgeItem[]; onSelect(i: KnowledgeItem): void }) {
  const C: Record<string, string> = { note: "#9f1239", web: "#0ea5e9", youtube: "#ef4444", pdf: "#b2213d", image: "#0d9488", video: "#7c3aed", file: "#a16207", scan: "#0f766e" };
  const placed = items.slice(0, 16).map((item, i) => {
    const a = (i / Math.max(items.length, 1)) * 2 * Math.PI;
    const r = i === 0 ? 0 : 95 + (i % 3) * 22;
    return { item, x: 150 + r * Math.cos(a), y: 150 + r * Math.sin(a) };
  });
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border-subtle)", padding: 14, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>🕸️ Knowledge Graph</strong>
        <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{items.length} nodes</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg width={300} height={300} viewBox="0 0 300 300" style={{ display: "block", margin: "0 auto" }}>
          {placed.slice(1).map(p => placed[0] && (
            <line key={p.item.id} x1={placed[0].x} y1={placed[0].y} x2={p.x} y2={p.y}
              stroke="var(--border-color)" strokeWidth={1} strokeDasharray="3,3" />
          ))}
          {placed.map((p, i) => (
            <g key={p.item.id} onClick={() => onSelect(p.item)} style={{ cursor: "pointer" }}>
              <circle cx={p.x} cy={p.y} r={i === 0 ? 22 : 14}
                fill={`${C[p.item.type] || "#888"}22`} stroke={C[p.item.type] || "#888"} strokeWidth={1.5} />
              <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={12} fill={C[p.item.type] || "#888"}>
                {getTypeIcon(p.item.type)}
              </text>
              {p.item.title && (
                <text x={p.x} y={p.y + 26} textAnchor="middle" fontSize={6.5} fill="var(--text-secondary)">
                  {p.item.title.slice(0, 10)}{p.item.title.length > 10 ? "…" : ""}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
const SK = "ownly_knowledge_v1";

export default function ConnectedKnowledge({ onBack }: { onBack(): void }) {
  const [items, setItems] = useState<KnowledgeItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(SK) || "[]"); } catch { return []; }
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<KnowledgeItem["type"] | "all" | "favorites">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showGraph, setShowGraph] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [viewer, setViewer] = useState<KnowledgeItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(SK, JSON.stringify(items)); }, [items]);

  const addItem = (item: KnowledgeItem) => setItems(p => [item, ...p]);
  const deleteItem = (id: string) => setItems(p => p.filter(i => i.id !== id));
  const toggleFav = (id: string) => setItems(p => p.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
  const openItem = (item: KnowledgeItem) => {
    setItems(p => p.map(i => i.id === item.id ? { ...i, lastOpenedAt: new Date().toISOString() } : i));
    if (item.url) setViewer(item);
    else if (item.uri) window.open(item.uri, "_blank");
  };

  function handleFileAdd(e: ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files || []).forEach(f => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      const type: KnowledgeItem["type"] =
        f.type.startsWith("image/") ? "image" :
        f.type.startsWith("video/") ? "video" :
        f.type === "application/pdf" || ext === "pdf" ? "pdf" : "file";
      addItem({
        id: uid(), type,
        title: f.name.replace(/\.[^.]+$/, ""),
        uri: URL.createObjectURL(f),
        domain: f.name,
        description: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
        fileSize: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
        tags: [],
        addedAt: new Date().toISOString(),
      });
    });
    e.target.value = "";
  }

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const ms = !q || [i.title, i.domain, i.description, ...(i.tags || []), i.content]
      .some(v => v?.toLowerCase().includes(q));
    const mf = filter === "all" ? true : filter === "favorites" ? !!i.isFavorite : i.type === filter;
    return ms && mf;
  });

  const FILTERS: { key: typeof filter; label: string; emoji: string }[] = [
    { key: "all", label: "All", emoji: "✦" },
    { key: "favorites", label: "Starred", emoji: "⭐" },
    { key: "web", label: "Web", emoji: "🌐" },
    { key: "youtube", label: "YouTube", emoji: "▶️" },
    { key: "pdf", label: "PDF", emoji: "📄" },
    { key: "image", label: "Images", emoji: "🖼️" },
    { key: "note", label: "Notes", emoji: "📓" },
    { key: "scan", label: "Scans", emoji: "📷" },
  ];

  const stats = [
    { label: "Total", count: items.length, color: "#9f1239" },
    { label: "Web", count: items.filter(i => i.type === "web").length, color: "#0ea5e9" },
    { label: "Videos", count: items.filter(i => i.type === "youtube" || i.type === "video").length, color: "#ef4444" },
    { label: "Files", count: items.filter(i => i.type === "pdf" || i.type === "file").length, color: "#a16207" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)", paddingBottom: 100 }}>
      {/* Web viewer overlay */}
      {viewer?.url && (
        <WebViewer url={viewer.url} title={viewer.title} onBack={() => setViewer(null)}
          onSave={(u, t, d) => {
            addItem({ id: uid(), type: "web", title: t, url: u, domain: d, description: `Saved from ${d}`, favicon: `https://www.google.com/s2/favicons?domain=${d}&sz=32`, tags: [], addedAt: new Date().toISOString() });
            setViewer(null);
          }} />
      )}

      {/* Add link dialog */}
      {showAddLink && <AddLinkDialog onAdd={item => { addItem(item); setShowAddLink(false); }} onClose={() => setShowAddLink(false)} />}

      {/* Sticky header */}
      <header style={{ position: "sticky", top: 0, zIndex: 60, background: "var(--bg-header)", borderBottom: "1px solid var(--border-color)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", padding: "10px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", display: "flex", padding: 4 }}>
            <Ic d={IC.back} size={22} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Manrope,sans-serif", fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>🌐 Connected Knowledge</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>Your living knowledge base</div>
          </div>
          <button onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 6, borderRadius: 8 }}>
            <Ic d={viewMode === "grid" ? IC.list : IC.grid} size={18} />
          </button>
          <button onClick={() => setShowGraph(g => !g)}
            style={{ background: showGraph ? "rgba(159,18,57,0.12)" : "none", border: "none", cursor: "pointer", color: showGraph ? "#9f1239" : "var(--text-secondary)", padding: 6, borderRadius: 8 }}>
            <Ic d={IC.graph} size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "0 12px", height: 40, marginBottom: 10 }}>
          <Ic d={IC.search} size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes, links, PDFs, tags…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-primary)" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}><Ic d={IC.x} size={14} /></button>}
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 10 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: "5px 12px", borderRadius: 20, border: "none", flexShrink: 0, fontWeight: 700, fontSize: 11, fontFamily: "Manrope,sans-serif", cursor: "pointer", transition: "all 0.12s", background: filter === f.key ? "#9f1239" : "var(--bg-chip)", color: filter === f.key ? "#fff" : "var(--text-secondary)" }}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: "16px 16px 0" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: "var(--bg-card)", borderRadius: 14, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
              <div style={{ fontFamily: "Manrope,sans-serif", fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 9, color: "var(--text-secondary)", fontWeight: 700, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {showGraph && <KnowledgeGraph items={items} onSelect={openItem} />}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌐</div>
            <strong style={{ display: "block", fontFamily: "Manrope,sans-serif", fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
              {search ? "No results found" : "Start Building Your Knowledge Base"}
            </strong>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, maxWidth: 300, margin: "0 auto 24px" }}>
              {search ? `No items matching "${search}"` : "Add web links, YouTube videos, PDFs, images and files — all connected in one place."}
            </p>
            {!search && (
              <button onClick={() => setShowAddLink(true)}
                style={{ background: "#9f1239", color: "#fff", border: "none", borderRadius: 16, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "Manrope,sans-serif" }}>
                + Add First Item
              </button>
            )}
          </div>
        )}

        {/* Item grid / list */}
        {filtered.length > 0 && (
          viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {filtered.map(item => (
                <KnowledgeCard key={item.id} item={item} onOpen={openItem} onDelete={deleteItem} onToggleFav={toggleFav} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(item => (
                <button key={item.id} onClick={() => openItem(item)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", textAlign: "left", cursor: "pointer", width: "100%" }}>
                  <span style={{ width: 42, height: 42, borderRadius: 10, background: `${getTypeColor(item.type)}1a`, color: getTypeColor(item.type), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {getTypeIcon(item.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "Manrope,sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title || item.domain}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.domain || item.description}
                    </div>
                  </div>
                  {item.isFavorite && <span style={{ color: "#f59e0b", fontSize: 14 }}>⭐</span>}
                  <Ic d={IC.chevR} size={16} />
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" multiple accept="*/*" style={{ display: "none" }} onChange={handleFileAdd} />

      {/* FABs */}
      <div style={{ position: "fixed", bottom: 84, right: 18, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", zIndex: 100 }}>
        <button onClick={() => fileRef.current?.click()} title="Add File"
          style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
          <Ic d={IC.clip} size={20} />
        </button>
        <button onClick={() => setShowAddLink(true)} title="Add URL / Link"
          style={{ width: 56, height: 56, borderRadius: "50%", background: "#9f1239", border: "none", boxShadow: "0 6px 24px rgba(159,18,57,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <Ic d={IC.plus} size={26} />
        </button>
      </div>
    </div>
  );
}
