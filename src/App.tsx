import { ChangeEvent, FormEvent, ReactNode, useRef, useState, useEffect } from "react";
import * as api from './lib/api';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "login" | "dashboard" | "editor" | "uploads" | "capture" | "links";

type IconName =
  | "arrow-left" | "arrow-right" | "book" | "camera" | "check"
  | "chevron-right" | "clock" | "file" | "flame" | "home" | "image"
  | "link" | "menu" | "more" | "note" | "paperclip" | "plus"
  | "search" | "share" | "sparkle" | "upload" | "video" | "moon" | "sun" | "user" | "x";

// ─── Icon Component ───────────────────────────────────────────────────────────
function Icon({ name, size = 20, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  const paths: Record<IconName, ReactNode> = {
    "arrow-left": <path d="m15 18-6-6 6-6" />,
    "arrow-right": <path d="m9 18 6-6-6-6" />,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z" /><circle cx="12" cy="13" r="3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    file: <><path d="M6 2h9l4 4v16H6Z" /><path d="M14 2v5h5M9 13h6M9 17h4" /></>,
    flame: <path d="M12 22c4 0 7-3 7-7 0-3-1.5-5.5-4-8 .1 3-1.4 4-2.3 4.5.5-3.7-1.5-6.2-4-8.5.2 3.5-3.7 6.1-3.7 11.5C5 18.6 8 22 12 22Z" />,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 15-4-4L5 20" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2A5 5 0 0 0 12 4l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
    menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    note: <><path d="M5 3h14v18H5Z" /><path d="M9 7h6M9 11h6M9 15h4" /></>,
    paperclip: <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 0 1-2.8-2.8l8.9-8.9" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></>,
    sparkle: <path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7Z" />,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 14v6h14v-6" /></>,
    video: <><rect x="2" y="7" width="15" height="10" rx="2" /><path d="m17 8 5-2v10l-5-2V8Z" /></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  };
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}
      stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>
      {paths[name]}
    </svg>
  );
}

// ─── Wordmark ─────────────────────────────────────────────────────────────────
function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className={`wordmark ${light ? "wordmark-light" : ""}`} aria-label="OWNLY">
      <span>O</span>WNLY<span className="wordmark-dot">.</span>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, onNavigate }: { active: string; onNavigate: (s: Screen) => void }) {
  const items: { label: string; icon: IconName; key: Screen }[] = [
    { label: "Home", icon: "home", key: "dashboard" },
    { label: "Notes", icon: "note", key: "editor" },
    { label: "Uploads", icon: "upload", key: "uploads" },
    { label: "Scan", icon: "camera", key: "capture" },
    { label: "Links", icon: "link", key: "links" },
  ];
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => (
        <button className={active === item.key ? "active" : ""} key={item.key}
          type="button" onClick={() => onNavigate(item.key)}>
          <span className="nav-icon"><Icon name={item.icon} size={20} /></span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "login") {
        const user = await api.login(email.trim(), password.trim());
        onLogin(user);
      } else if (mode === "signup") {
        const user = await api.register(email.trim(), password.trim(), name.trim() || email.split("@")[0]);
        onLogin(user);
      } else {
        await api.forgotPassword(email.trim());
        setSuccess("Check your email for reset instructions.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen screen-enter">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <form className="login-card" onSubmit={submit}>
        <Wordmark light />
        <div className="login-heading">
          <p>{mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}</p>
          <h1>{mode === "login" ? "Login" : mode === "signup" ? "Sign Up" : "Forgot Password"}</h1>
        </div>

        {error && <div style={{ background: "rgba(255,80,80,.2)", border: "1px solid rgba(255,80,80,.3)", borderRadius: 10, padding: "10px 14px", color: "#ffaaaa", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ background: "rgba(80,230,180,.15)", border: "1px solid rgba(80,230,180,.25)", borderRadius: 10, padding: "10px 14px", color: "#80f5cc", fontSize: 13, marginBottom: 12 }}>{success}</div>}

        {mode === "signup" && (
          <div className="field-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {mode !== "forgot" && (
          <div className="field-group password-field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input id="password" type={passwordVisible ? "text" : "password"} placeholder="••••••••"
                required value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setPasswordVisible(v => !v)}>
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        )}
        {mode === "login" && (
          <button className="forgot" type="button" onClick={() => setMode("forgot")}>Forgot password?</button>
        )}
        {mode !== "login" && <div style={{ marginTop: 24 }} />}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? <><span>Log in</span> <Icon name="arrow-right" size={18} /></> : mode === "signup" ? <><span>Sign up</span> <Icon name="arrow-right" size={18} /></> : "Send reset"}
        </button>
        <p className="signup-copy">
          {mode === "login" ? (<>No account? <button type="button" onClick={() => setMode("signup")}>Sign up</button></>) :
           mode === "signup" ? (<>Have an account? <button type="button" onClick={() => setMode("login")}>Log in</button></>) :
           (<button type="button" onClick={() => setMode("login")}>← Back to login</button>)}
        </p>
      </form>
    </main>
  );
}

// ─── Account Drawer ───────────────────────────────────────────────────────────
function AccountDrawer({ user, onLogout, onClose }: { user: any; onLogout: () => void; onClose: () => void }) {
  const initials = user?.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", marginLeft: "auto", width: "82%", maxWidth: 360, height: "100%",
        background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-12px 0 40px rgba(0,0,0,0.22)",
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(150deg,#9f1239,#6e082b)", padding: "48px 24px 24px", color: "#fff" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <Icon name="x" size={18} />
          </button>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff3", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            {initials}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name || "User"}</div>
          <div style={{ opacity: 0.75, fontSize: 13, marginTop: 4 }}>{user?.email || "—"}</div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {[{ label: "Name", value: user?.name || "—" }, { label: "Email", value: user?.email || "—" }, { label: "Plan", value: user?.plan || "Personal Pro" }].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #f0eae8" }}>
              <span style={{ color: "#888", fontSize: 13 }}>{row.label}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: "16px 24px 32px" }}>
          <button onClick={onLogout} style={{ width: "100%", padding: "15px", background: "#d33f5e", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", letterSpacing: 0.3 }}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardScreen({ onNavigate, onOpenAccount, user, darkMode, toggleDark }: {
  onNavigate: (s: Screen) => void; onOpenAccount: () => void; user: any; darkMode: boolean; toggleDark: () => void;
}) {
  const [search, setSearch] = useState("");
  const [viewAll, setViewAll] = useState(false);
  const initials = user?.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "AR";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { count: 24, label: "Notes", icon: "note" as IconName, color: "cyan", screen: "editor" as Screen },
    { count: 11, label: "Uploads", icon: "upload" as IconName, color: "yellow", screen: "uploads" as Screen },
    { count: 7, label: "Scans", icon: "camera" as IconName, color: "green", screen: "capture" as Screen },
    { count: 18, label: "Links", icon: "link" as IconName, color: "orange", screen: "links" as Screen },
  ];
  const actions = [
    { label: "New note", icon: "plus" as IconName, color: "cyan", screen: "editor" as Screen },
    { label: "Upload", icon: "upload" as IconName, color: "purple", screen: "uploads" as Screen },
    { label: "Scan", icon: "camera" as IconName, color: "green", screen: "capture" as Screen },
    { label: "Add link", icon: "link" as IconName, color: "orange", screen: "links" as Screen },
  ];
  const notes = [
    { tag: "Biology", tagClass: "", title: "Biology Chapter 4 — Cell Division", when: "2h ago", icon: "book" as IconName, thumb: "biology" },
    { tag: "History", tagClass: "history-tag", title: "French Revolution Timeline", when: "Yesterday", icon: "file" as IconName, thumb: "history" },
    { tag: "Chemistry", tagClass: "history-tag", title: "Organic Chemistry Lab Notes", when: "Mon", icon: "note" as IconName, thumb: "history" },
  ];
  const visible = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.tag.toLowerCase().includes(search.toLowerCase()));
  const displayed = viewAll ? visible : visible.slice(0, 2);

  return (
    <main className="app-screen screen-enter">
      {/* Topbar */}
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onOpenAccount} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#19161b" }}>
            <Icon name="menu" size={22} />
          </button>
          <Wordmark />
        </div>
        <div className="topbar-title">
          <strong>Dashboard</strong>
          <span>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggleDark} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#19161b" }}>
            <Icon name={darkMode ? "sun" : "moon"} size={20} />
          </button>
          <button className="avatar" type="button" onClick={onOpenAccount} aria-label="Open profile">
            {initials}<span />
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Greeting + Search */}
        <section className="greeting" style={{ flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
            <div>
              <p className="eyebrow">{greeting}</p>
              <h1>Welcome back, {user?.name?.split(" ")[0] || "Alex"} <span className="wave">👋</span></h1>
              <p className="subcopy">Ready for another focused session?</p>
            </div>
          </div>
          {/* Working Search Bar */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 14, padding: "0 14px", height: 46, border: "1px solid #eee8dd", width: "100%", boxSizing: "border-box" }}>
            <Icon name="search" size={18} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes, tags…"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent" }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#999" }}><Icon name="x" size={16} /></button>}
          </label>
        </section>

        {/* Stats */}
        <section className="stats-grid" aria-label="Library totals">
          {stats.map(s => (
            <button className="stat-card interactive-box" key={s.label} type="button" onClick={() => onNavigate(s.screen)}>
              <span className={`icon-chip ${s.color}`}><Icon name={s.icon} size={18} /></span>
              <strong>{s.count}</strong>
              <span>{s.label}</span>
            </button>
          ))}
        </section>

        {/* Quick actions */}
        <section className="content-section">
          <div className="section-heading">
            <h2>Quick actions</h2>
            <div className="weekly"><Icon name="flame" size={15} /> 12 items this week</div>
          </div>
          <div className="actions-grid">
            {actions.map(a => (
              <button className="action-card interactive-box" key={a.label} type="button" onClick={() => onNavigate(a.screen)}>
                <span className={`action-icon ${a.color}`}><Icon name={a.icon} size={21} /></span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Review banner */}
        <button className="review-banner" type="button" onClick={() => onNavigate("editor")}>
          <span className="sparkle-icon"><Icon name="sparkle" size={20} /></span>
          <span>
            <small>Ready to revisit?</small>
            <strong>Cell division is due for review</strong>
          </span>
          <Icon name="chevron-right" size={18} />
        </button>

        {/* Recent Notes */}
        <section className="content-section recent-section">
          <div className="section-heading">
            <h2>Recent notes</h2>
            <button type="button" onClick={() => setViewAll(v => !v)} style={{ color: "#95183d", fontWeight: 700, fontSize: 12, border: "none", background: "transparent", cursor: "pointer" }}>
              {viewAll ? "Show less" : "View all"}
            </button>
          </div>
          <div className="notes-list">
            {displayed.length === 0 && search && (
              <div style={{ textAlign: "center", padding: 24, color: "#aaa", fontSize: 14 }}>No results for "{search}"</div>
            )}
            {displayed.map((n, i) => (
              <button className="note-card" key={i} type="button" onClick={() => onNavigate("editor")}>
                <span className={`note-thumbnail ${n.thumb}`}><Icon name={n.icon} size={22} /></span>
                <span className="note-details">
                  <span className={`note-tag ${n.tagClass}`}>{n.tag}</span>
                  <strong>{n.title}</strong>
                  <small><Icon name="clock" size={12} /> Edited {n.when}</small>
                </span>
                <Icon name="chevron-right" size={18} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </main>
  );
}

// ─── Notes / Editor Screen (Samsung Notes style) ──────────────────────────────
type Block = { type: "text"; id: number } | { type: "image"; id: number; src: string } | { type: "video"; id: number; src: string };

function EditorScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [blocks, setBlocks] = useState<Block[]>([{ type: "text", id: 1 }]);
  const [title, setTitle] = useState("New Note");
  const [tag, setTag] = useState("General");
  const [saved, setSaved] = useState(true);
  const idRef = useRef(2);
  const nextId = () => idRef.current++;

  function addImage(file: File) {
    const src = URL.createObjectURL(file);
    const newBlock: Block = { type: "image", id: nextId(), src };
    const textAfter: Block = { type: "text", id: nextId() };
    setBlocks(b => [...b, newBlock, textAfter]);
    setSaved(false);
  }
  function addVideo(file: File) {
    const src = URL.createObjectURL(file);
    const newBlock: Block = { type: "video", id: nextId(), src };
    const textAfter: Block = { type: "text", id: nextId() };
    setBlocks(b => [...b, newBlock, textAfter]);
    setSaved(false);
  }

  return (
    <main className="app-screen editor-screen screen-enter">
      <header className="topbar">
        <button type="button" onClick={() => onNavigate("dashboard")} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#333" }}>
          <Icon name="arrow-left" size={20} />
        </button>
        <div className="topbar-title">
          <strong>Notes</strong>
          <span>Private workspace</span>
        </div>
        <button className={`save-status ${saved ? "saved" : ""}`} type="button" onClick={() => setSaved(true)} style={{ fontSize: 12 }}>
          {saved ? <><Icon name="check" size={14} /> Saved</> : "Save"}
        </button>
      </header>

      <div className="editor-content">
        {/* Title */}
        <input value={title} onChange={e => { setTitle(e.target.value); setSaved(false); }}
          style={{ width: "100%", border: "none", outline: "none", fontSize: 22, fontWeight: 800, fontFamily: "Manrope, sans-serif", background: "transparent", marginBottom: 8, letterSpacing: -0.5 }} />

        {/* Tag */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {["General", "Biology", "History", "Math", "Chemistry"].map(t => (
            <button key={t} type="button" onClick={() => setTag(t)}
              style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: tag === t ? "#9f1239" : "#f0eae8", color: tag === t ? "#fff" : "#7a3d42" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Formatting Toolbar */}
        <div className="format-toolbar" aria-label="Text formatting" style={{ overflowX: "auto", display: "flex", gap: 4 }}>
          {["B", "I", "U", "H1", "H2", "• List", '" Quote'].map((f, i) => (
            <button key={i} type="button" onMouseDown={e => { e.preventDefault(); document.execCommand(["bold","italic","underline","","","insertUnorderedList",""][i] || ""); }}>
              {f === "B" ? <strong>B</strong> : f === "I" ? <em>I</em> : f === "U" ? <u>U</u> : f}
            </button>
          ))}
        </div>

        {/* Blocks: text, image, video interleaved like Samsung Notes */}
        <article className="note-editor">
          {blocks.map((block) => {
            if (block.type === "text") {
              return (
                <div key={block.id} className="body-copy" contentEditable suppressContentEditableWarning
                  onInput={() => setSaved(false)}
                  style={{ minHeight: 48, outline: "none" }}
                  data-placeholder="Start typing…"
                />
              );
            } else if (block.type === "image") {
              return (
                <div key={block.id} style={{ margin: "10px 0", position: "relative" }}>
                  <img src={block.src} alt="" style={{ width: "100%", borderRadius: 12, display: "block" }} />
                  <button type="button" onClick={() => setBlocks(b => b.filter(bl => bl.id !== block.id))}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                    <Icon name="x" size={16} />
                  </button>
                </div>
              );
            } else {
              return (
                <div key={block.id} style={{ margin: "10px 0", position: "relative" }}>
                  <video src={block.src} controls style={{ width: "100%", borderRadius: 12, display: "block" }} />
                  <button type="button" onClick={() => setBlocks(b => b.filter(bl => bl.id !== block.id))}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                    <Icon name="x" size={16} />
                  </button>
                </div>
              );
            }
          })}
        </article>
      </div>

      {/* Footer toolbar */}
      <div className="editor-footer">
        <div className="insert-tools">
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", padding: 8 }} title="Add image">
            <Icon name="image" size={22} />
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && addImage(e.target.files[0])} />
          </label>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", padding: 8 }} title="Add video">
            <Icon name="video" size={22} />
            <input type="file" accept="video/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && addVideo(e.target.files[0])} />
          </label>
          <button type="button" onClick={() => { setBlocks(b => [...b, { type: "text", id: nextId() }]); setSaved(false); }}
            style={{ display: "flex", alignItems: "center", padding: 8, background: "none", border: "none", cursor: "pointer" }} title="Add text block">
            <Icon name="plus" size={22} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="share-button" type="button" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="share" size={16} /> Share
          </button>
        </div>
      </div>

      <BottomNav active="editor" onNavigate={onNavigate} />
    </main>
  );
}

// ─── Uploads Screen ───────────────────────────────────────────────────────────
type UploadFile = { id: number; name: string; meta: string; color: string; uri?: string; file?: File };

function UploadsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const idRef = useRef(100);
  const [files, setFiles] = useState<UploadFile[]>([
    { id: 1, name: "Sample Biology Notes.pdf", meta: "PDF · 2.4 MB · Today", color: "rose", uri: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
    { id: 2, name: "History Diagram.png", meta: "PNG · 840 KB · Yesterday", color: "cyan" },
    { id: 3, name: "Calculus Worksheet.docx", meta: "DOCX · 180 KB · Sep 28", color: "yellow" },
  ]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [viewing, setViewing] = useState<UploadFile | null>(null);

  function addFiles(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const newFiles: UploadFile[] = selected.map(f => ({
      id: idRef.current++,
      name: f.name,
      meta: `${f.type.split("/").pop()?.toUpperCase() || "FILE"} · ${Math.max(1, Math.round(f.size / 1024))} KB · Just now`,
      color: "yellow",
      file: f,
      uri: URL.createObjectURL(f),
    }));
    setFiles(cur => [...newFiles, ...cur]);
    e.target.value = "";
  }

  const filters = ["All", "PDF", "Images", "Docs"];
  const visible = files.filter(f => {
    const matchesQuery = f.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All" ||
      (filter === "PDF" && f.name.match(/\.pdf$/i)) ||
      (filter === "Images" && f.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) ||
      (filter === "Docs" && f.name.match(/\.(doc|docx|txt|xls|xlsx|ppt)$/i));
    return matchesQuery && matchesFilter;
  });

  if (viewing) {
    const docUri = viewing.uri || (viewing.file ? URL.createObjectURL(viewing.file) : "");
    return (
      <main className="app-screen screen-enter" style={{ display: "flex", flexDirection: "column" }}>
        <header className="topbar">
          <button onClick={() => setViewing(null)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Icon name="arrow-left" size={22} />
          </button>
          <div className="topbar-title"><strong style={{ fontSize: 13, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{viewing.name}</strong></div>
          <span style={{ width: 24 }} />
        </header>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {viewing.name.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
            <img src={docUri} alt={viewing.name} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#f0f0f0" }} />
          ) : viewing.name.match(/\.(mp4|mov|webm)$/i) ? (
            <video src={docUri} controls style={{ width: "100%", height: "100%" }} />
          ) : (
            <DocViewer documents={[{ uri: docUri, fileName: viewing.name }]} pluginRenderers={DocViewerRenderers}
              style={{ width: "100%", height: "100%" }} config={{ header: { disableHeader: true } }} />
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="app-screen library-screen screen-enter">
      <header className="section-topbar">
        <Wordmark />
        <div><strong>Uploads</strong><span>{files.length} files</span></div>
        <label className="header-action" aria-label="Upload">
          <Icon name="plus" size={22} />
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.mp4,.mov" onChange={addFiles} />
        </label>
      </header>

      <div className="library-content">
        {/* Drop zone */}
        <label className="drop-zone interactive-box">
          <span className="drop-icon"><Icon name="upload" size={27} /></span>
          <span>
            <strong>Upload files</strong>
            <small>PDF, Images, Word, Excel, Video · up to 100 MB</small>
            <b>Browse files</b>
          </span>
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.mp4,.mov" onChange={addFiles} />
        </label>

        {/* Search */}
        <label className="search-field">
          <Icon name="search" size={17} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your uploads" />
          {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={14} /></button>}
        </label>

        {/* Filter chips */}
        <div className="filter-chips">
          {filters.map(f => (
            <button key={f} className={filter === f ? "selected" : ""} type="button" onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {/* File list */}
        <div className="file-list">
          {visible.map(file => (
            <article className="file-row interactive-box" key={file.id} onClick={() => setViewing(file)} style={{ cursor: "pointer" }}>
              <span className={`file-icon ${file.color}`}>
                <Icon name={file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? "image" : file.name.match(/\.(mp4|mov)$/i) ? "video" : "file"} size={19} />
              </span>
              <span>
                <strong>{file.name}</strong>
                <small>{file.meta}</small>
              </span>
              <button type="button" aria-label={`Remove ${file.name}`} onClick={e => { e.stopPropagation(); setFiles(cur => cur.filter(f => f.id !== file.id)); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 8 }}>
                <Icon name="x" size={18} />
              </button>
            </article>
          ))}
          {visible.length === 0 && (
            <div className="empty-state">{query ? `No files match "${query}"` : "No files yet. Upload something!"}</div>
          )}
        </div>
      </div>
      <BottomNav active="uploads" onNavigate={onNavigate} />
    </main>
  );
}

// ─── Document Scanner / Capture Screen ───────────────────────────────────────
function CaptureScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [scanning, setScanning] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [scannedImg, setScannedImg] = useState<string | null>(null);

  function scan() {
    if (scanning) return;
    setCaptured(false); setScanning(true);
    setTimeout(() => { setScanning(false); setCaptured(true); }, 2200);
  }
  function handleGallery(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setScannedImg(URL.createObjectURL(f)); setCaptured(true); }
  }

  return (
    <main className="app-screen capture-screen screen-enter">
      <header className="section-topbar">
        <Wordmark />
        <div><strong>Capture</strong><span>Document Scanner</span></div>
        <span className="header-spacer" />
      </header>
      <div className="capture-content">
        <div className={`scanner-stage ${scanning ? "is-scanning" : ""}`}>
          <div className="wallpaper-shape shape-one" /><div className="wallpaper-shape shape-two" /><div className="wallpaper-shape shape-three" />
          <div className="scan-copy">
            <span className="scan-badge">
              <Icon name={captured ? "check" : "sparkle"} size={16} />
              {captured ? "Scan complete" : scanning ? "Detecting edges…" : "AI Document Scanner"}
            </span>
            <h1>{captured ? "PDF Ready." : "Scan a physical document."}</h1>
            <p>{captured ? "Your document has been captured. Tap below to convert to PDF." : "Hold your camera over the page. Auto-detects edges, crops and straightens."}</p>
          </div>

          {/* Preview */}
          {scannedImg && (
            <div style={{ margin: "12px auto", width: "85%", borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
              <img src={scannedImg} alt="Scanned" style={{ width: "100%", display: "block" }} />
            </div>
          )}

          <div className="scan-frame">
            <i className="corner top-left" /><i className="corner top-right" />
            <i className="corner bottom-left" /><i className="corner bottom-right" />
            <div className="scan-line" />
          </div>
        </div>

        <div className="capture-actions">
          <label className="gallery-button interactive-box">
            <Icon name="image" size={21} /> Gallery
            <input type="file" accept="image/*" onChange={handleGallery} />
          </label>
          <button className={`shutter-button ${scanning ? "scanning" : ""}`} type="button" onClick={scan} aria-label="Scan">
            <span><Icon name="camera" size={26} /></span>
          </button>
          {captured ? (
            <button className="gallery-button interactive-box" type="button"
              onClick={() => { alert("PDF saved to Uploads!"); onNavigate("uploads"); }}
              style={{ background: "#9f1239", color: "#fff", border: "none" }}>
              <Icon name="file" size={21} /> Save PDF
            </button>
          ) : (
            <button className="gallery-button interactive-box" type="button" onClick={() => setCaptured(false)}>
              <Icon name="clock" size={21} /> Recent
            </button>
          )}
        </div>
        <p className="capture-hint">{scanning ? "Keep steady…" : captured ? "Tap 'Save PDF' to export" : "Tap the camera to scan"}</p>
      </div>
      <BottomNav active="capture" onNavigate={onNavigate} />
    </main>
  );
}

// ─── Links Screen (YouTube style) ─────────────────────────────────────────────
type SavedLink = { id: number; title: string; url: string; description: string; thumb?: string; };

const DEMO_LINKS: SavedLink[] = [
  { id: 1, title: "MIT OpenCourseWare — Calculus Integration", url: "https://youtube.com", description: "Integration techniques and worked examples.", thumb: "https://img.youtube.com/vi/WUvTyaaNkzM/maxresdefault.jpg" },
  { id: 2, title: "Khan Academy: Organic Chemistry", url: "https://khanacademy.org", description: "Bonding, resonance, and reaction mechanisms." },
  { id: 3, title: "Nature — How cells divide", url: "https://nature.com", description: "Illustrated overview of mitosis." },
];

function LinksScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const idRef = useRef(50);
  const [links, setLinks] = useState<SavedLink[]>(DEMO_LINKS);
  const [url, setUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  function saveLink(e: FormEvent) {
    e.preventDefault();
    const val = url.trim();
    if (!val) return;
    const domain = val.replace(/^https?:\/\//, "").split("/")[0];
    setLinks(cur => [{ id: idRef.current++, title: linkTitle.trim() || domain, url: val.startsWith("http") ? val : `https://${val}`, description: "Saved just now", }, ...cur]);
    setUrl(""); setLinkTitle("");
  }

  const visible = links.filter(l =>
    l.title.toLowerCase().includes(query.toLowerCase()) || l.url.toLowerCase().includes(query.toLowerCase())
  );

  function startEdit(link: SavedLink) { setEditingId(link.id); setEditTitle(link.title); }
  function confirmEdit(id: number) {
    setLinks(cur => cur.map(l => l.id === id ? { ...l, title: editTitle } : l));
    setEditingId(null);
  }

  const isYouTube = (u: string) => u.includes("youtube.com") || u.includes("youtu.be");
  const getYouTubeId = (u: string) => { const m = u.match(/(?:v=|youtu\.be\/)([^&?]+)/); return m?.[1]; };

  return (
    <main className="app-screen library-screen screen-enter">
      <header className="section-topbar">
        <Wordmark />
        <div><strong>Links</strong><span>{links.length} saved</span></div>
        <span className="header-spacer" />
      </header>

      <div className="library-content">
        {/* Add link form */}
        <form className="save-link-card interactive-box" onSubmit={saveLink} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="drop-icon" style={{ width: 40, height: 40, fontSize: 18 }}><Icon name="link" size={20} /></span>
            <span><strong>Save a link</strong><small style={{ display: "block" }}>Articles, YouTube videos, references</small></span>
          </div>
          <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Custom title (optional)"
            style={{ border: "1px solid #e5e0da", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #e5e0da", borderRadius: 10, padding: "0 14px" }}>
            <Icon name="link" size={16} />
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a URL…" type="url"
              style={{ flex: 1, border: "none", outline: "none", padding: "11px 0", fontSize: 13, background: "transparent" }} />
            <button type="submit" style={{ background: "#9f1239", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Save</button>
          </label>
        </form>

        {/* Search */}
        <label className="search-field">
          <Icon name="search" size={17} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search saved links" />
          {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={14} /></button>}
        </label>

        {/* YouTube-style grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {visible.map(link => {
            const ytId = isYouTube(link.url) ? getYouTubeId(link.url) : null;
            const thumb = link.thumb || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null);
            return (
              <article key={link.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(60,50,54,0.06)", boxShadow: "0 2px 12px rgba(40,30,34,0.05)" }}>
                {/* Thumbnail */}
                <div style={{ width: "100%", height: 190, background: thumb ? "transparent" : "#f0ece8", position: "relative", cursor: "pointer" }}
                  onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}>
                  {thumb ? <img src={thumb} alt={link.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => (e.currentTarget.style.display = "none")} />
                    : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "#9f1239" }}>
                        <Icon name="link" size={36} />
                        <small style={{ color: "#aaa", fontSize: 11 }}>{link.url.replace(/^https?:\/\//, "").split("/")[0]}</small>
                      </div>}
                  {ytId && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 50, height: 50, background: "rgba(0,0,0,0.7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ borderLeft: "20px solid #fff", borderTop: "12px solid transparent", borderBottom: "12px solid transparent", marginLeft: 5 }} />
                    </div>
                  </div>}
                </div>

                {/* Info */}
                <div style={{ padding: "12px 14px" }}>
                  {editingId === link.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        style={{ flex: 1, border: "1px solid #9f1239", borderRadius: 6, padding: "6px 10px", fontSize: 13, outline: "none" }} />
                      <button onClick={() => confirmEdit(link.id)} style={{ background: "#9f1239", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Done</button>
                    </div>
                  ) : (
                    <strong style={{ fontSize: 14, fontFamily: "Manrope,sans-serif", display: "block", marginBottom: 4, cursor: "pointer", lineHeight: 1.4 }}
                      onClick={() => startEdit(link)} title="Click to rename">
                      {link.title}
                    </strong>
                  )}
                  <div style={{ fontSize: 11, color: "#aaa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{link.url.replace(/^https?:\/\//, "").split("/")[0]}</span>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => startEdit(link)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9f1239", fontSize: 11, fontWeight: 700 }}>Rename</button>
                      <button onClick={() => window.open(link.url, "_blank")} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: 11 }}>Open ↗</button>
                      <button onClick={() => setLinks(cur => cur.filter(l => l.id !== link.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#d33" }}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {visible.length === 0 && (
            <div className="empty-state">{query ? `No links match "${query}"` : "No links saved yet."}</div>
          )}
        </div>
      </div>
      <BottomNav active="links" onNavigate={onNavigate} />
    </main>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const token = localStorage.getItem("ownly_auth_token");
    if (token) {
      setScreen("dashboard");
      // Try to restore user from cache
      try { const u = localStorage.getItem("ownly_user"); if (u) setUser(JSON.parse(u)); } catch {}
    }
    setIsCheckingAuth(false);
  }, []);

  function handleLogin(u: any) {
    setUser(u);
    localStorage.setItem("ownly_user", JSON.stringify(u));
    setScreen("dashboard");
  }

  function handleLogout() {
    api.logout();
    localStorage.removeItem("ownly_user");
    setUser(null);
    setDrawerOpen(false);
    setScreen("login");
  }

  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: "100vh", background: "#3d061f", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>OWNLY</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      {screen === "login" && <LoginScreen onLogin={handleLogin} />}
      {screen === "dashboard" && (
        <DashboardScreen onNavigate={setScreen} onOpenAccount={() => setDrawerOpen(true)}
          user={user} darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)} />
      )}
      {screen === "editor" && <EditorScreen onNavigate={setScreen} />}
      {screen === "uploads" && <UploadsScreen onNavigate={setScreen} />}
      {screen === "capture" && <CaptureScreen onNavigate={setScreen} />}
      {screen === "links" && <LinksScreen onNavigate={setScreen} />}

      {drawerOpen && (
        <AccountDrawer user={user} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
      )}
    </>
  );
}
