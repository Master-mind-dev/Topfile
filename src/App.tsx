import {
  ChangeEvent, FormEvent, ReactNode, useRef,
  useState, useEffect, useCallback
} from "react";
import * as api from './lib/api';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Screen = "login" | "dashboard" | "notes" | "note-editor" | "uploads" | "capture" | "links";

interface NoteBlock {
  id: string;
  type: "text" | "image" | "video";
  html?: string;
  src?: string;
}

interface Note {
  id: string;
  title: string;
  tags: string[];
  blocks: NoteBlock[];
  createdAt: string;
  updatedAt: string;
}

interface UploadFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uri: string;
  file?: File;
  addedAt: string;
}

interface SavedLink {
  id: string;
  title: string;
  url: string;
  description: string;
  thumb?: string;
  addedAt: string;
}

interface AppUser {
  name: string;
  email: string;
  plan?: string;
  avatarUrl?: string;
}

// ─── STORAGE (localStorage with API fallback) ─────────────────────────────────
const KEYS = { notes: "ownly_notes_v2", uploads: "ownly_uploads_v2", links: "ownly_links_v2", user: "ownly_user" };
function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── ICON ─────────────────────────────────────────────────────────────────────
type IconName =
  "arrow-left" | "arrow-right" | "book" | "camera" | "check" | "chevron-right" |
  "clock" | "file" | "flame" | "home" | "image" | "link" | "more" | "note" |
  "paperclip" | "plus" | "search" | "share" | "sparkle" | "upload" | "video" |
  "moon" | "sun" | "user" | "x" | "edit" | "trash" | "tag" | "bold" | "italic" |
  "underline" | "list" | "quote" | "h1" | "h2" | "external";

function Icon({ name, size = 20, sw = 1.8, className = "" }: {
  name: IconName; size?: number; sw?: number; className?: string;
}) {
  const d: Record<IconName, ReactNode> = {
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
    more: <><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
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
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" /></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
    bold: <><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></>,
    italic: <><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></>,
    underline: <><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    quote: <><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></>,
    h1: <><path d="M4 12h8M4 18V6M12 18V6M17 12l3-2v8" /></>,
    h2: <><path d="M4 12h8M4 18V6M12 18V6M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" /></>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
  };
  return (
    <svg aria-hidden className={className} fill="none" height={size} viewBox="0 0 24 24"
      width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}>
      {d[name]}
    </svg>
  );
}

// ─── APP HEADER ───────────────────────────────────────────────────────────────
function AppHeader({
  title, screen, onBack, onOpenAccount, onToggleDark, darkMode, user, rightExtra
}: {
  title: string; screen: Screen; onBack?: () => void;
  onOpenAccount: () => void; onToggleDark: () => void;
  darkMode: boolean; user: AppUser | null; rightExtra?: ReactNode;
}) {
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const avatarBg = user?.avatarUrl ? "transparent" : "#9f1239";
  const showBack = screen !== "dashboard";

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "grid", gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center", minHeight: 60, paddingTop: "env(safe-area-inset-top)",
      padding: "env(safe-area-inset-top) 16px 0",
      background: "rgba(255,255,255,0.96)", borderBottom: "1px solid #eeeae3",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)"
    }}>
      {/* Left: back or avatar */}
      <div style={{ display: "flex", alignItems: "center", paddingBottom: 14, paddingTop: 14 }}>
        {showBack && (
          <button onClick={onBack} style={iconBtnStyle}>
            <Icon name="arrow-left" size={22} />
          </button>
        )}
      </div>

      {/* Center: page title */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2, paddingBottom: 14, paddingTop: 14 }}>
        <strong style={{ fontFamily: "Manrope, sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>{title}</strong>
        <span style={{ fontSize: 10, color: "#a09890" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Right: dark mode + user icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, paddingBottom: 14, paddingTop: 14 }}>
        {rightExtra}
        <button onClick={onOpenAccount} aria-label="Open account" style={{
          ...iconBtnStyle, width: 36, height: 36, borderRadius: "50%",
          background: avatarBg, color: "#fff", fontWeight: 800, fontSize: 13,
          fontFamily: "Manrope, sans-serif", position: "relative"
        }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
          ) : initials}
          <span style={{ position: "absolute", right: 0, bottom: 0, width: 9, height: 9, borderRadius: "50%", background: "#4fe2d9", border: "2px solid #fff" }} />
        </button>
      </div>
    </header>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: "transparent", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 36, height: 36, borderRadius: "50%",
  color: "#19161b", transition: "background 0.15s"
};

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
const navItems: { label: string; icon: IconName; screen: Screen }[] = [
  { label: "Home", icon: "home", screen: "dashboard" },
  { label: "Notes", icon: "note", screen: "notes" },
  { label: "Uploads", icon: "upload", screen: "uploads" },
  { label: "Scan", icon: "camera", screen: "capture" },
  { label: "Links", icon: "link", screen: "links" },
];

function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      height: `calc(66px + env(safe-area-inset-bottom))`,
      display: "grid", gridTemplateColumns: "repeat(5,1fr)",
      padding: "8px 4px env(safe-area-inset-bottom)",
      background: "rgba(255,255,255,0.97)", borderTop: "1px solid #eee9e2",
      boxShadow: "0 -4px 20px rgba(54,43,36,0.06)", backdropFilter: "blur(14px)"
    }}>
      {navItems.map(it => (
        <button key={it.screen} type="button" onClick={() => onNavigate(it.screen)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 3, border: "none", background: "transparent",
            cursor: "pointer", fontSize: 9, fontWeight: 600, fontFamily: "Manrope, sans-serif",
            color: active === it.screen ? "#b2213d" : "#99918a", transition: "color 0.15s"
          }}>
          <span style={{
            width: 36, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 10, background: active === it.screen ? "#fff1bd" : "transparent",
            transition: "background 0.15s"
          }}>
            <Icon name={it.icon} size={21} />
          </span>
          {it.label}
        </button>
      ))}
    </nav>
  );
}

// ─── ACCOUNT DRAWER ───────────────────────────────────────────────────────────
function AccountDrawer({
  user, onLogout, onClose, onUpdateAvatar, darkMode, toggleDark
}: {
  user: AppUser | null; onLogout: () => void; onClose: () => void;
  onUpdateAvatar: (url: string) => void; darkMode: boolean; toggleDark: () => void;
}) {
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const fileRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onUpdateAvatar(URL.createObjectURL(f));
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: "82%", maxWidth: 360,
        background: "#fff", display: "flex", flexDirection: "column",
        boxShadow: "-16px 0 60px rgba(0,0,0,0.2)"
      }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(150deg,#9f1239,#6e082b)", padding: "calc(env(safe-area-inset-top) + 48px) 24px 28px", color: "#fff", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: `calc(env(safe-area-inset-top) + 12px)`, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <Icon name="x" size={18} />
          </button>

          {/* Editable avatar */}
          <div style={{ position: "relative", width: 68, height: 68, marginBottom: 14 }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, fontFamily: "Manrope,sans-serif", overflow: "hidden", cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%", background: "#fff", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9f1239" }}>
              <Icon name="edit" size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>

          <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "Manrope,sans-serif" }}>{user?.name || "User"}</div>
          <div style={{ opacity: 0.7, fontSize: 13, marginTop: 4 }}>{user?.email || "—"}</div>
          <div style={{ marginTop: 8, display: "inline-block", background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600 }}>{user?.plan || "Personal Pro"}</div>
        </div>

        {/* Settings */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          <div style={{ padding: "14px 24px", borderBottom: "1px solid #f5f0eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Dark Mode</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Toggle dark appearance</div>
            </div>
            <button onClick={toggleDark} style={{
              width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
              background: darkMode ? "#9f1239" : "#ddd", position: "relative", transition: "background 0.2s"
            }}>
              <span style={{ position: "absolute", top: 3, left: darkMode ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", display: "block" }} />
            </button>
          </div>
          {[{ label: "Name", val: user?.name }, { label: "Email", val: user?.email }].map(row => (
            <div key={row.label} style={{ padding: "14px 24px", borderBottom: "1px solid #f5f0eb", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#888", fontSize: 13 }}>{row.label}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{row.val || "—"}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 24px", paddingBottom: `calc(16px + env(safe-area-inset-bottom))` }}>
          <button onClick={onLogout} style={{ width: "100%", padding: 15, background: "#d33f5e", color: "#fff", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Manrope,sans-serif" }}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (u: AppUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "login") {
        const u = await api.login(email.trim(), password);
        onLogin({ name: u.name || email.split("@")[0], email: u.email || email, plan: u.plan });
      } else if (mode === "signup") {
        const u = await api.register(email.trim(), password, name.trim() || email.split("@")[0]);
        onLogin({ name: u.name || name || email.split("@")[0], email: u.email || email });
      } else {
        await api.forgotPassword(email.trim());
        setSuccess("Check your email for a reset link.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const titles = { login: "Login", signup: "Sign Up", forgot: "Forgot Password" };
  const subs = { login: "Welcome back", signup: "Create your account", forgot: "Reset your password" };

  return (
    <main className="login-screen screen-enter">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <form className="login-card" onSubmit={submit}>
        {/* Wordmark */}
        <div className="wordmark wordmark-light" style={{ textAlign: "center", marginBottom: 20 }} aria-label="OWNLY">
          <span>O</span>WNLY<span className="wordmark-dot">.</span>
        </div>

        <div className="login-heading">
          <p>{subs[mode]}</p>
          <h1>{titles[mode]}</h1>
        </div>

        {error && <div style={{ background: "rgba(220,50,50,.2)", border: "1px solid rgba(220,50,50,.35)", borderRadius: 12, padding: "10px 14px", color: "#ffb4b4", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</div>}
        {success && <div style={{ background: "rgba(60,220,160,.15)", border: "1px solid rgba(60,220,160,.25)", borderRadius: 12, padding: "10px 14px", color: "#80f0cc", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{success}</div>}

        {mode === "signup" && (
          <div className="field-group">
            <label>Full Name</label>
            <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="field-group">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {mode !== "forgot" && (
          <div className="field-group password-field">
            <label>Password</label>
            <div className="input-wrap">
              <input type={showPwd ? "text" : "password"} placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPwd(v => !v)}>{showPwd ? "Hide" : "Show"}</button>
            </div>
          </div>
        )}
        {mode === "login" && <button className="forgot" type="button" onClick={() => setMode("forgot")}>Forgot password?</button>}
        {mode !== "login" && <div style={{ marginTop: 24 }} />}

        <button className="primary-button" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? "Please wait…" : mode === "login" ? <><span>Log in</span>&nbsp;<Icon name="arrow-right" size={18} /></> : mode === "signup" ? <><span>Sign up</span>&nbsp;<Icon name="arrow-right" size={18} /></> : "Send reset link"}
        </button>

        <p className="signup-copy">
          {mode === "login" && <><span>No account? </span><button type="button" onClick={() => { setMode("signup"); setError(""); }}>Sign up</button></>}
          {mode === "signup" && <><span>Have an account? </span><button type="button" onClick={() => { setMode("login"); setError(""); }}>Log in</button></>}
          {mode === "forgot" && <button type="button" onClick={() => { setMode("login"); setError(""); }}>← Back to login</button>}
        </p>
      </form>
    </main>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardScreen({ onNavigate, headerProps, notes, uploads, links }: {
  onNavigate: (s: Screen) => void;
  headerProps: HeaderProps;
  notes: Note[]; uploads: UploadFile[]; links: SavedLink[];
}) {
  const [search, setSearch] = useState("");
  const [viewAll, setViewAll] = useState(false);
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  const firstName = headerProps.user?.name?.split(" ")[0] || "there";

  const recentNotes = (notes || []).filter(n =>
    !search || (n.title || "").toLowerCase().includes(search.toLowerCase()) || (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );
  const shown = viewAll ? recentNotes : recentNotes.slice(0, 3);

  const stats = [
    { count: notes?.length || 0, label: "Notes", icon: "note" as IconName, screen: "notes" as Screen, color: "cyan" },
    { count: uploads?.length || 0, label: "Uploads", icon: "upload" as IconName, screen: "uploads" as Screen, color: "yellow" },
    { count: 0, label: "Scans", icon: "camera" as IconName, screen: "capture" as Screen, color: "green" },
    { count: links?.length || 0, label: "Links", icon: "link" as IconName, screen: "links" as Screen, color: "orange" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#f7f6f3", paddingBottom: 76 }}>
      <AppHeader title="Dashboard" screen="dashboard" {...headerProps} />

      <div style={{ padding: "20px 18px" }}>
        {/* Greeting */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, fontFamily: "Manrope,sans-serif", letterSpacing: 2, textTransform: "uppercase", color: "#9d1d42" }}>{greeting}</p>
          <h1 style={{ margin: "6px 0 4px", fontFamily: "Manrope,sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: -0.6 }}>
            Hey, {firstName} <span style={{ display: "inline-block", animation: "wave 1.5s ease-in-out 1" }}>👋</span>
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#8a8589" }}>Ready for another focused session?</p>
        </div>

        {/* Search */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 14, padding: "0 14px", height: 48, border: "1px solid #eee8dd", marginBottom: 20, boxShadow: "0 2px 8px rgba(40,30,34,0.04)" }}>
          <Icon name="search" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes, tags…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><Icon name="x" size={16} /></button>}
        </label>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
          {stats.map(s => (
            <button key={s.label} onClick={() => onNavigate(s.screen)} style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px 10px 11px",
              border: "1px solid rgba(60,50,54,0.07)", borderRadius: 16, background: "rgba(255,255,255,0.78)",
              boxShadow: "0 7px 16px rgba(41,32,36,0.04)", cursor: "pointer", transition: "transform 0.15s"
            }}>
              <span className={`icon-chip ${s.color}`} style={{ marginBottom: 10 }}><Icon name={s.icon} size={18} /></span>
              <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 18, fontWeight: 800 }}>{s.count}</strong>
              <span style={{ fontSize: 10, color: "#8a8589", marginTop: 2 }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "Manrope,sans-serif", fontSize: 15, fontWeight: 800 }}>Quick actions</h2>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#8a8589", fontSize: 10 }}>
              <Icon name="flame" size={14} />{(notes?.length || 0) + (uploads?.length || 0)} items
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { l: "New note", i: "plus" as IconName, c: "cyan", s: "notes" as Screen },
              { l: "Upload", i: "upload" as IconName, c: "purple", s: "uploads" as Screen },
              { l: "Scan", i: "camera" as IconName, c: "green", s: "capture" as Screen },
              { l: "Add link", i: "link" as IconName, c: "orange", s: "links" as Screen },
            ].map(a => (
              <button key={a.l} onClick={() => onNavigate(a.s)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "12px 3px 10px",
                border: "1px solid rgba(60,50,54,0.06)", borderRadius: 15, background: "#fff",
                fontSize: 9, fontWeight: 600, fontFamily: "Manrope,sans-serif", cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s"
              }}>
                <span className={`action-icon ${a.c}`}><Icon name={a.i} size={20} /></span>
                {a.l}
              </button>
            ))}
          </div>
        </div>

        {/* Recent notes */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "Manrope,sans-serif", fontSize: 15, fontWeight: 800 }}>Recent notes</h2>
            <button onClick={() => setViewAll(v => !v)} style={{ border: "none", background: "none", cursor: "pointer", color: "#95183d", fontWeight: 700, fontSize: 12, fontFamily: "Manrope,sans-serif" }}>
              {viewAll ? "Show less" : "View all"}
            </button>
          </div>
          {shown.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#bbb", fontSize: 14 }}>
              {search ? `No notes matching "${search}"` : "No notes yet. Create your first note!"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {shown.map(note => (
                <button key={note.id} onClick={() => onNavigate("note-editor")} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12,
                  padding: 12, border: "1px solid rgba(60,50,54,0.07)", borderRadius: 16,
                  background: "#fff", textAlign: "left", cursor: "pointer", boxShadow: "0 2px 8px rgba(40,30,34,0.04)"
                }}>
                  <span style={{ width: 46, height: 50, borderRadius: 11, background: "#f5dfe6", color: "#7a2440", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="note" size={22} />
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    {note.tags && note.tags.length > 0 && (
                      <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {note.tags.slice(0, 2).map(t => (
                          <span key={t} style={{ padding: "2px 7px", borderRadius: 10, background: "#f8e8ed", color: "#8f2241", fontSize: 9, fontWeight: 700, fontFamily: "Manrope,sans-serif" }}>{t}</span>
                        ))}
                      </span>
                    )}
                    <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.title || "Untitled"}</strong>
                    <small style={{ display: "flex", alignItems: "center", gap: 3, color: "#aaa", fontSize: 9 }}>
                      <Icon name="clock" size={11} /> {new Date(note.updatedAt).toLocaleDateString()}
                    </small>
                  </span>
                  <Icon name="chevron-right" size={18} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </main>
  );
}

// ─── NOTES LIST SCREEN ────────────────────────────────────────────────────────
function NotesListScreen({ onNavigate, headerProps, notes, onNewNote, onOpenNote, onDeleteNote }: {
  onNavigate: (s: Screen) => void; headerProps: HeaderProps;
  notes: Note[]; onNewNote: () => void; onOpenNote: (id: string) => void; onDeleteNote: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = (notes || []).filter(n =>
    (n.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main style={{ minHeight: "100vh", background: "#f7f6f3", paddingBottom: 76 }}>
      <AppHeader title="Notes" screen="notes" {...headerProps}
        rightExtra={
          <button onClick={onNewNote} style={{ ...iconBtnStyle, color: "#9f1239" }} aria-label="New note">
            <Icon name="plus" size={22} />
          </button>
        }
      />

      <div style={{ padding: "16px 18px" }}>
        {/* Search */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 14, padding: "0 14px", height: 46, border: "1px solid #eee8dd", marginBottom: 16, boxShadow: "0 2px 8px rgba(40,30,34,0.04)" }}>
          <Icon name="search" size={17} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><Icon name="x" size={14} /></button>}
        </label>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Icon name="note" size={48} className="" />
            <p style={{ color: "#bbb", marginTop: 12 }}>{search ? `No notes for "${search}"` : "No notes yet."}</p>
            <button onClick={onNewNote} style={{ marginTop: 12, padding: "10px 24px", background: "#9f1239", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
              Create your first note
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(note => {
              const textBlock = (note.blocks || []).find(b => b.type === "text" && b.html);
              const preview = textBlock?.html ? textBlock.html.replace(/<[^>]+>/g, "").slice(0, 80) : "No content";
              return (
                <div key={note.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(60,50,54,0.07)", boxShadow: "0 2px 8px rgba(40,30,34,0.04)", overflow: "hidden" }}>
                  <button onClick={() => onOpenNote(note.id)} style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 15, fontWeight: 700, flex: 1, marginRight: 8 }}>{note.title || "Untitled"}</strong>
                      <span style={{ fontSize: 10, color: "#bbb", whiteSpace: "nowrap" }}>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {note.tags && note.tags.length > 0 && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                        {note.tags.map(t => (
                          <span key={t} style={{ padding: "2px 8px", borderRadius: 10, background: "#f8e8ed", color: "#8f2241", fontSize: 10, fontWeight: 700, fontFamily: "Manrope,sans-serif" }}>{t}</span>
                        ))}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{preview}</p>
                  </button>
                  {/* Small icon row */}
                  <div style={{ borderTop: "1px solid #f0eae8", display: "flex", justifyContent: "flex-end", padding: "6px 12px", gap: 8 }}>
                    <button onClick={() => onOpenNote(note.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9f1239", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
                      <Icon name="edit" size={14} /> Open
                    </button>
                    <button onClick={() => onDeleteNote(note.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e05", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav active="notes" onNavigate={onNavigate} />
    </main>
  );
}

// ─── NOTE EDITOR (Samsung Notes style) ───────────────────────────────────────
function NoteEditorScreen({ onNavigate, headerProps, note, onSave }: {
  onNavigate: (s: Screen) => void; headerProps: HeaderProps;
  note: Note; onSave: (n: Note) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [blocks, setBlocks] = useState<NoteBlock[]>(
    note.blocks && note.blocks.length ? note.blocks : [{ id: "b1", type: "text", html: "" }]
  );
  const [saved, setSaved] = useState(true);
  const editorRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const idCounter = useRef(1000);

  const uid = () => `b-${idCounter.current++}-${Date.now()}`;

  // Auto-save
  useEffect(() => {
    if (!saved) {
      const t = setTimeout(() => {
        onSave({ ...note, title, tags, blocks, updatedAt: new Date().toISOString() });
        setSaved(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [saved, title, tags, blocks]);

  function markDirty() { setSaved(false); }

  function formatText(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    markDirty();
  }

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,/g, "");
      if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); markDirty(); }
      setTagInput("");
    }
  }

  function removeTag(t: string) { setTags(prev => prev.filter(x => x !== t)); markDirty(); }

  function addImageBlock(file: File) {
    const src = URL.createObjectURL(file);
    const imgBlock: NoteBlock = { id: uid(), type: "image", src };
    const textBlock: NoteBlock = { id: uid(), type: "text", html: "" };
    setBlocks(prev => [...prev, imgBlock, textBlock]);
    markDirty();
  }

  function addVideoBlock(file: File) {
    const src = URL.createObjectURL(file);
    const vidBlock: NoteBlock = { id: uid(), type: "video", src };
    const textBlock: NoteBlock = { id: uid(), type: "text", html: "" };
    setBlocks(prev => [...prev, vidBlock, textBlock]);
    markDirty();
  }

  function deleteBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id));
    markDirty();
  }

  function updateBlockHtml(id: string, html: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, html } : b));
    markDirty();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#fcfbf9", paddingBottom: 120 }}>
      <AppHeader title="Note" screen="note-editor" onBack={() => onNavigate("notes")} {...headerProps}
        rightExtra={
          <span style={{ fontSize: 11, color: saved ? "#4caf50" : "#ff9800", fontWeight: 700, fontFamily: "Manrope,sans-serif" }}>
            {saved ? "✓ Saved" : "Saving…"}
          </span>
        }
      />

      <div style={{ padding: "16px 18px" }}>
        {/* Title */}
        <input value={title} onChange={e => { setTitle(e.target.value); markDirty(); }}
          placeholder="Note title…" style={{
            width: "100%", border: "none", outline: "none", fontSize: 24, fontWeight: 800,
            fontFamily: "Manrope, sans-serif", background: "transparent", marginBottom: 12,
            letterSpacing: -0.6, boxSizing: "border-box"
          }} />

        {/* Tags (user-defined) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, alignItems: "center" }}>
          {tags.map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "#9f1239", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "Manrope,sans-serif" }}>
              {t}
              <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", padding: 0 }}>
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
            placeholder="+ Add tag (Enter)"
            style={{ border: "1px dashed #ddd", borderRadius: 20, padding: "4px 12px", fontSize: 12, outline: "none", background: "transparent", color: "#666", minWidth: 110 }} />
        </div>

        {/* Format toolbar */}
        <div style={{
          display: "flex", gap: 4, overflowX: "auto", padding: "8px 0 8px",
          borderTop: "1px solid #eee", borderBottom: "1px solid #eee", marginBottom: 16, scrollbarWidth: "none"
        }}>
          {([
            { icon: "bold" as IconName, cmd: "bold", label: "B" },
            { icon: "italic" as IconName, cmd: "italic", label: "I" },
            { icon: "underline" as IconName, cmd: "underline", label: "U" },
          ]).map(f => (
            <button key={f.cmd} type="button"
              onMouseDown={e => { e.preventDefault(); formatText(f.cmd); }}
              style={{ minWidth: 36, height: 34, border: "1px solid #eee", borderRadius: 8, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {f.cmd === "bold" ? <strong>B</strong> : f.cmd === "italic" ? <em style={{ fontStyle: "italic" }}>I</em> : <u>U</u>}
            </button>
          ))}
          <div style={{ width: 1, background: "#eee", margin: "4px 2px" }} />
          {([
            { label: "H1", cmd: "formatBlock", val: "h1" },
            { label: "H2", cmd: "formatBlock", val: "h2" },
            { label: "• List", cmd: "insertUnorderedList", val: undefined },
            { label: '" Quote', cmd: "formatBlock", val: "blockquote" },
          ]).map(f => (
            <button key={f.label} type="button"
              onMouseDown={e => { e.preventDefault(); formatText(f.cmd, f.val); }}
              style={{ minWidth: 44, height: 34, border: "1px solid #eee", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "Manrope,sans-serif", whiteSpace: "nowrap", padding: "0 8px" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Content blocks */}
        <div>
          {blocks.map((block, idx) => {
            if (block.type === "text") {
              return (
                <div key={block.id} ref={el => { if (el) editorRefs.current.set(block.id, el); }}
                  contentEditable suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: block.html || "" }}
                  onInput={e => updateBlockHtml(block.id, (e.target as HTMLDivElement).innerHTML)}
                  data-placeholder={idx === 0 ? "Start writing your note…" : "Continue writing…"}
                  style={{
                    minHeight: 48, outline: "none", fontSize: 15, lineHeight: 1.7,
                    color: "#241d21", fontFamily: "DM Sans, sans-serif",
                    position: "relative"
                  }}
                />
              );
            } else if (block.type === "image") {
              return (
                <div key={block.id} style={{ margin: "12px 0", position: "relative", borderRadius: 14, overflow: "hidden" }}>
                  <img src={block.src} alt="" style={{ width: "100%", display: "block", borderRadius: 14 }} />
                  <button onClick={() => deleteBlock(block.id)} style={{
                    position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(0,0,0,0.65)", border: "none", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", color: "#fff"
                  }}><Icon name="x" size={16} /></button>
                </div>
              );
            } else {
              return (
                <div key={block.id} style={{ margin: "12px 0", position: "relative", borderRadius: 14, overflow: "hidden" }}>
                  <video src={block.src} controls style={{ width: "100%", borderRadius: 14, display: "block" }} />
                  <button onClick={() => deleteBlock(block.id)} style={{
                    position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(0,0,0,0.65)", border: "none", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", color: "#fff"
                  }}><Icon name="x" size={16} /></button>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Fixed bottom toolbar */}
      <div style={{
        position: "fixed", bottom: "env(safe-area-inset-bottom)", left: 0, right: 0,
        background: "rgba(255,255,255,0.97)", borderTop: "1px solid #eee8dd",
        display: "flex", alignItems: "center", gap: 4, padding: "10px 16px",
        backdropFilter: "blur(14px)", zIndex: 30
      }}>
        <label style={{ display: "flex", alignItems: "center", padding: 10, cursor: "pointer", borderRadius: 10, background: "#f5f0eb" }} title="Insert image">
          <Icon name="image" size={22} />
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && addImageBlock(e.target.files[0])} />
        </label>
        <label style={{ display: "flex", alignItems: "center", padding: 10, cursor: "pointer", borderRadius: 10, background: "#f5f0eb" }} title="Insert video">
          <Icon name="video" size={22} />
          <input type="file" accept="video/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && addVideoBlock(e.target.files[0])} />
        </label>
        <button onClick={() => { setBlocks(p => [...p, { id: uid(), type: "text", html: "" }]); markDirty(); }}
          style={{ display: "flex", alignItems: "center", padding: 10, cursor: "pointer", borderRadius: 10, background: "#f5f0eb", border: "none" }} title="Add text block">
          <Icon name="plus" size={22} />
        </button>
        <div style={{ flex: 1 }} />
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "#f5f0eb", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          <Icon name="share" size={16} /> Share
        </button>
      </div>
    </main>
  );
}

// ─── UPLOADS SCREEN ───────────────────────────────────────────────────────────
function UploadsScreen({ onNavigate, headerProps, files, onAddFiles, onDeleteFile }: {
  onNavigate: (s: Screen) => void; headerProps: HeaderProps;
  files: UploadFile[]; onAddFiles: (f: UploadFile[]) => void; onDeleteFile: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [viewing, setViewing] = useState<UploadFile | null>(null);

  function handleAdd(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const newFiles: UploadFile[] = selected.map(f => ({
      id: `f-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
      type: f.type || "unknown",
      uri: URL.createObjectURL(f),
      file: f,
      addedAt: new Date().toISOString(),
    }));
    onAddFiles(newFiles);
    e.target.value = "";
  }

  const isImage = (f: UploadFile) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.name) || f.type.startsWith("image/");
  const isVideo = (f: UploadFile) => /\.(mp4|mov|webm|avi)$/i.test(f.name) || f.type.startsWith("video/");
  const isPDF = (f: UploadFile) => /\.pdf$/i.test(f.name) || f.type === "application/pdf";
  const isDoc = (f: UploadFile) => /\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/i.test(f.name);

  const filtered = files.filter(f => {
    const q = f.name.toLowerCase().includes(query.toLowerCase());
    if (filter === "All") return q;
    if (filter === "Images") return q && isImage(f);
    if (filter === "Videos") return q && isVideo(f);
    if (filter === "PDF") return q && isPDF(f);
    if (filter === "Docs") return q && isDoc(f);
    return q;
  });

  if (viewing) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#111" }}>
        <AppHeader title={viewing.name.slice(0, 24)} screen="uploads" onBack={() => setViewing(null)} {...headerProps} />
        <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isImage(viewing) ? (
            <img src={viewing.uri} alt={viewing.name} style={{ maxWidth: "100%", maxHeight: "calc(100vh - 120px)", objectFit: "contain" }} />
          ) : isVideo(viewing) ? (
            <video src={viewing.uri} controls autoPlay style={{ maxWidth: "100%", maxHeight: "calc(100vh - 120px)" }} />
          ) : (
            <div style={{ width: "100%", height: "calc(100vh - 60px)", background: "#fff" }}>
              <DocViewer
                documents={[{ uri: viewing.uri, fileName: viewing.name }]}
                pluginRenderers={DocViewerRenderers}
                style={{ width: "100%", height: "100%" }}
                config={{ header: { disableHeader: true }, pdfVerticalScrollByDefault: true }}
              />
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f7f6f3", paddingBottom: 76 }}>
      <AppHeader title="Uploads" screen="uploads" {...headerProps}
        rightExtra={
          <label style={{ ...iconBtnStyle, cursor: "pointer" }} aria-label="Upload file">
            <Icon name="plus" size={22} />
            <input type="file" multiple style={{ display: "none" }}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              onChange={handleAdd} />
          </label>
        }
      />

      <div style={{ padding: "16px 18px" }}>
        {/* Drop zone */}
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 16px", background: "#fff", border: "2px dashed #e0d8d5", borderRadius: 20, cursor: "pointer", marginBottom: 16, textAlign: "center" }}>
          <Icon name="upload" size={28} />
          <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 14 }}>Upload files</strong>
          <small style={{ color: "#999", fontSize: 12 }}>PDF, Images, Word, Excel, Video, ZIP</small>
          <span style={{ padding: "6px 16px", background: "#9f1239", color: "#fff", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Browse files</span>
          <input type="file" multiple style={{ display: "none" }}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            onChange={handleAdd} />
        </label>

        {/* Search */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 13, padding: "0 13px", height: 44, border: "1px solid #eee8dd", marginBottom: 12 }}>
          <Icon name="search" size={16} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search uploads…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent" }} />
          {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><Icon name="x" size={14} /></button>}
        </label>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16 }}>
          {["All", "Images", "PDF", "Docs", "Videos"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700, fontFamily: "Manrope,sans-serif", whiteSpace: "nowrap",
              background: filter === f ? "#9f1239" : "#fff", color: filter === f ? "#fff" : "#666",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
            }}>{f}</button>
          ))}
        </div>

        {/* File list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
            {query ? `No files matching "${query}"` : "No files yet."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(file => (
              <div key={file.id} onClick={() => setViewing(file)} style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12,
                padding: "12px 14px", background: "#fff", borderRadius: 14, cursor: "pointer",
                border: "1px solid rgba(60,50,54,0.07)", boxShadow: "0 2px 8px rgba(40,30,34,0.04)",
                transition: "transform 0.12s"
              }}>
                <span style={{
                  width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: isImage(file) ? "#e3f8fd" : isPDF(file) ? "#fde8e8" : isVideo(file) ? "#e8eafd" : "#fef5e0",
                  color: isImage(file) ? "#0ea5e9" : isPDF(file) ? "#e53e3e" : isVideo(file) ? "#6366f1" : "#d97706"
                }}>
                  <Icon name={isImage(file) ? "image" : isVideo(file) ? "video" : "file"} size={20} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 13, fontWeight: 700, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</strong>
                  <small style={{ color: "#aaa", fontSize: 11 }}>{file.size} · {new Date(file.addedAt).toLocaleDateString()}</small>
                </span>
                <button onClick={e => { e.stopPropagation(); onDeleteFile(file.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", padding: 6 }}>
                  <Icon name="trash" size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="uploads" onNavigate={onNavigate} />
    </main>
  );
}

// ─── SCANNER SCREEN ───────────────────────────────────────────────────────────
function CaptureScreen({ onNavigate, headerProps }: { onNavigate: (s: Screen) => void; headerProps: HeaderProps }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setCameraActive(true); setCameraError("");
    } catch (e: any) {
      setCameraError("Camera not accessible: " + (e.message || "Permission denied"));
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setCameraActive(false);
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    setPreview(c.toDataURL("image/jpeg", 0.92));
    setPhase("scanning");
    stopCamera();
    setTimeout(() => setPhase("done"), 1800);
  }

  function handleGallery(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setPreview(URL.createObjectURL(f)); setPhase("done"); }
  }

  function savePDF() {
    alert("PDF saved to Uploads! (In production, this converts the image to PDF on the server)");
    onNavigate("uploads");
  }

  function reset() { setPhase("idle"); setPreview(null); stopCamera(); }

  useEffect(() => () => stopCamera(), []);

  return (
    <main style={{ minHeight: "100vh", background: "#f7f6f3", paddingBottom: 76 }}>
      <AppHeader title="Capture" screen="capture" {...headerProps} />

      <div style={{ padding: "20px 18px" }}>
        {/* Header card */}
        <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 20, background: "linear-gradient(150deg,#9f1239,#6e082b)", color: "#fff", padding: "20px 20px 16px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              {phase === "done" ? "✓ Complete" : phase === "scanning" ? "⏳ Processing…" : "✦ AI Scanner"}
            </span>
          </div>
          <h2 style={{ margin: "0 0 6px", fontFamily: "Manrope,sans-serif", fontSize: 20, fontWeight: 800 }}>
            {phase === "done" ? "Document captured!" : "Scan your document"}
          </h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>
            {phase === "done" ? "Your document is ready. Save it as PDF or retake." : "Point your camera at a page. AI will auto-detect edges and enhance."}
          </p>
        </div>

        {/* Camera / preview */}
        {phase === "idle" && (
          <>
            {cameraActive ? (
              <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 16, position: "relative", background: "#000", aspectRatio: "4/3" }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {/* Scanning frame overlay */}
                <div style={{ position: "absolute", inset: 20, border: "2px solid rgba(255,255,255,0.6)", borderRadius: 12, pointerEvents: "none" }}>
                  {["top-left", "top-right", "bottom-left", "bottom-right"].map(c => (
                    <div key={c} style={{
                      position: "absolute", width: 20, height: 20,
                      top: c.includes("top") ? -2 : "auto", bottom: c.includes("bottom") ? -2 : "auto",
                      left: c.includes("left") ? -2 : "auto", right: c.includes("right") ? -2 : "auto",
                      borderTop: c.includes("top") ? "3px solid #fff" : "none",
                      borderBottom: c.includes("bottom") ? "3px solid #fff" : "none",
                      borderLeft: c.includes("left") ? "3px solid #fff" : "none",
                      borderRight: c.includes("right") ? "3px solid #fff" : "none",
                      borderRadius: c.includes("top-left") ? "4px 0 0 0" : c.includes("top-right") ? "0 4px 0 0" : c.includes("bottom-left") ? "0 0 0 4px" : "0 0 4px 0"
                    }} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ borderRadius: 20, background: "#f0eae8", aspectRatio: "4/3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
                <Icon name="camera" size={48} />
                <p style={{ margin: 0, color: "#888", fontSize: 14 }}>Camera preview will appear here</p>
                {cameraError && <p style={{ margin: 0, color: "#e05", fontSize: 12, textAlign: "center", padding: "0 20px" }}>{cameraError}</p>}
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 20px", borderRadius: 16, background: "#fff", border: "1px solid #eee", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                <Icon name="image" size={24} /> Gallery
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleGallery} />
              </label>
              <button onClick={cameraActive ? capture : startCamera}
                style={{ width: 72, height: 72, borderRadius: "50%", background: "#9f1239", border: "4px solid #fff", boxShadow: "0 4px 20px rgba(159,18,57,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                <Icon name={cameraActive ? "check" : "camera"} size={28} />
              </button>
              {cameraActive && (
                <button onClick={stopCamera} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 20px", borderRadius: 16, background: "#fff", border: "1px solid #eee", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#e05" }}>
                  <Icon name="x" size={24} /> Cancel
                </button>
              )}
            </div>
          </>
        )}

        {/* Scanning */}
        {phase === "scanning" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            {preview && <img src={preview} alt="" style={{ width: "80%", borderRadius: 16, opacity: 0.6, marginBottom: 20 }} />}
            <div style={{ width: 40, height: 40, border: "3px solid #eee", borderTopColor: "#9f1239", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#888", fontSize: 14 }}>Processing document…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Done */}
        {phase === "done" && (
          <div>
            {preview && <img src={preview} alt="" style={{ width: "100%", borderRadius: 16, marginBottom: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }} />}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={reset} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid #eee", background: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Retake
              </button>
              <button onClick={savePDF} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: "#9f1239", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Save as PDF
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="capture" onNavigate={onNavigate} />
    </main>
  );
}

// ─── LINKS SCREEN ─────────────────────────────────────────────────────────────
function LinksScreen({ onNavigate, headerProps, links, onAddLink, onDeleteLink, onRenameLink }: {
  onNavigate: (s: Screen) => void; headerProps: HeaderProps;
  links: SavedLink[]; onAddLink: (l: SavedLink) => void;
  onDeleteLink: (id: string) => void; onRenameLink: (id: string, t: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  function addLink(e: FormEvent) {
    e.preventDefault();
    const val = url.trim();
    if (!val) return;
    const fullUrl = val.startsWith("http") ? val : `https://${val}`;
    const domain = fullUrl.replace(/^https?:\/\//, "").split("/")[0];
    const ytId = getYouTubeId(fullUrl);
    onAddLink({
      id: `l-${Date.now()}`,
      title: customTitle.trim() || domain,
      url: fullUrl,
      description: "Saved just now",
      thumb: ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : undefined,
      addedAt: new Date().toISOString(),
    });
    setUrl(""); setCustomTitle("");
  }

  function getYouTubeId(u: string) {
    const m = u.match(/(?:v=|youtu\.be\/|embed\/)([^&?/\s]{11})/);
    return m?.[1] || null;
  }

  const filtered = links.filter(l =>
    l.title.toLowerCase().includes(query.toLowerCase()) ||
    l.url.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main style={{ minHeight: "100vh", background: "#f7f6f3", paddingBottom: 76 }}>
      <AppHeader title="Links" screen="links" {...headerProps} />

      <div style={{ padding: "16px 18px" }}>
        {/* Add form */}
        <form onSubmit={addLink} style={{ background: "#fff", borderRadius: 18, padding: "16px", marginBottom: 16, border: "1px solid #eee8dd", boxShadow: "0 2px 8px rgba(40,30,34,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0e8ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#9f1239" }}>
              <Icon name="link" size={18} />
            </div>
            <div>
              <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 14, fontWeight: 700 }}>Save a link</strong>
              <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>YouTube, articles, any URL</p>
            </div>
          </div>
          <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Custom title (optional)"
            style={{ width: "100%", border: "1px solid #eee", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste URL or YouTube link…" type="url"
              style={{ flex: 1, border: "1px solid #eee", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <button type="submit" style={{ padding: "9px 18px", background: "#9f1239", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Manrope,sans-serif" }}>
              Save
            </button>
          </div>
        </form>

        {/* Search */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 13, padding: "0 13px", height: 44, border: "1px solid #eee8dd", marginBottom: 16 }}>
          <Icon name="search" size={16} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search links…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent" }} />
          {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb" }}><Icon name="x" size={14} /></button>}
        </label>

        {/* Links grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
            {query ? `No links matching "${query}"` : "No links saved yet."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(link => {
              const ytId = getYouTubeId(link.url);
              const isYT = !!ytId;
              const thumb = link.thumb || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null);

              return (
                <article key={link.id} style={{ background: "#fff", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(60,50,54,0.07)", boxShadow: "0 3px 12px rgba(40,30,34,0.05)" }}>
                  {/* Thumbnail / Embed */}
                  <div style={{ width: "100%", height: 200, background: "#f0ece8", position: "relative", cursor: "pointer" }}
                    onClick={() => window.open(link.url, "_blank")}>
                    {thumb ? (
                      <img src={thumb} alt={link.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={e => (e.currentTarget.parentElement!.style.background = "#f0ece8")} />
                    ) : (
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#ccc" }}>
                        <Icon name="external" size={36} />
                        <small style={{ fontSize: 12, color: "#bbb" }}>{link.url.replace(/^https?:\/\//, "").split("/")[0]}</small>
                      </div>
                    )}
                    {isYT && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ borderLeft: "20px solid #fff", borderTop: "12px solid transparent", borderBottom: "12px solid transparent", marginLeft: 5 }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "12px 14px 10px" }}>
                    {editingId === link.id ? (
                      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && (onRenameLink(link.id, editTitle), setEditingId(null))}
                          style={{ flex: 1, border: "1px solid #9f1239", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                        <button onClick={() => { onRenameLink(link.id, editTitle); setEditingId(null); }}
                          style={{ background: "#9f1239", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓</button>
                      </div>
                    ) : (
                      <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 14, fontWeight: 700, display: "block", lineHeight: 1.4, marginBottom: 4 }}>{link.title}</strong>
                    )}
                    <div style={{ fontSize: 11, color: "#aaa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: "55%", whiteSpace: "nowrap" }}>
                        {link.url.replace(/^https?:\/\//, "").split("/")[0]}
                      </span>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={() => { setEditingId(link.id); setEditTitle(link.title); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9f1239", fontSize: 11, fontWeight: 700 }}>Rename</button>
                        <button onClick={() => window.open(link.url, "_blank")}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: 11 }}>Open ↗</button>
                        <button onClick={() => onDeleteLink(link.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#e05" }}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav active="links" onNavigate={onNavigate} />
    </main>
  );
}

// ─── HEADER PROPS TYPE ────────────────────────────────────────────────────────
type HeaderProps = {
  user: AppUser | null;
  onOpenAccount: () => void;
  onToggleDark: () => void;
  darkMode: boolean;
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [user, setUser] = useState<AppUser | null>(() => load<AppUser | null>(KEYS.user, null));
  const [notes, setNotes] = useState<Note[]>(() => load<Note[]>(KEYS.notes, []) || []);
  const [uploads, setUploads] = useState<UploadFile[]>(() => load<UploadFile[]>(KEYS.uploads, []) || []);
  const [links, setLinks] = useState<SavedLink[]>(() => load<SavedLink[]>(KEYS.links, []) || []);
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Persist on change
  useEffect(() => { save(KEYS.notes, notes); }, [notes]);
  useEffect(() => { save(KEYS.links, links); }, [links]);
  useEffect(() => { if (user) save(KEYS.user, user); }, [user]);
  useEffect(() => {
    document.documentElement.style.setProperty("color-scheme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("ownly_auth_token");
    if (token) {
      setScreen("dashboard");
      // Try to load from server
      api.getUserProfile().then(p => { if (p) setUser({ name: p.name, email: p.email, plan: p.plan }); }).catch(() => {});
      api.getNotes().then(n => { if (n?.length) setNotes(n); }).catch(() => {});
      api.getLinks().then(l => { if (l?.length) setLinks(l); }).catch(() => {});
    }
    setCheckingAuth(false);
  }, []);

  function handleLogin(u: AppUser) {
    setUser(u); save(KEYS.user, u); setScreen("dashboard");
  }
  function handleLogout() {
    api.logout(); localStorage.clear(); setUser(null); setScreen("login"); setDrawerOpen(false);
  }
  function handleUpdateAvatar(url: string) {
    setUser(prev => prev ? { ...prev, avatarUrl: url } : prev);
  }

  // Notes CRUD
  function createNote() {
    const id = `n-${Date.now()}`;
    const note: Note = { id, title: "New Note", tags: [], blocks: [{ id: "b1", type: "text", html: "" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setNotes(p => [note, ...p]);
    setActiveNoteId(id);
    setScreen("note-editor");
  }
  function openNote(id: string) { setActiveNoteId(id); setScreen("note-editor"); }
  function saveNote(n: Note) {
    setNotes(p => p.map(x => x.id === n.id ? n : x));
    api.updateNote(n.id, { title: n.title, content: JSON.stringify(n.blocks), category: n.tags[0] || "General" }).catch(() => {});
  }
  function deleteNote(id: string) { setNotes(p => p.filter(n => n.id !== id)); api.deleteNote(id).catch(() => {}); }

  // Uploads
  function addUploadFiles(files: UploadFile[]) { setUploads(p => [...files, ...p]); }
  function deleteUpload(id: string) { setUploads(p => p.filter(f => f.id !== id)); }

  // Links
  function addLink(l: SavedLink) {
    setLinks(p => [l, ...p]);
    api.createLink({ url: l.url, title: l.title, description: l.description }).catch(() => {});
  }
  function deleteLink(id: string) { setLinks(p => p.filter(l => l.id !== id)); api.deleteLink(id).catch(() => {}); }
  function renameLink(id: string, title: string) { setLinks(p => p.map(l => l.id === id ? { ...l, title } : l)); }

  const headerProps: HeaderProps = {
    user, onOpenAccount: () => setDrawerOpen(true),
    onToggleDark: () => setDarkMode(d => !d), darkMode
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  if (checkingAuth) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(150deg,#9f1239,#3d061f)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, fontFamily: "Manrope,sans-serif" }}>OWNLY</p>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } } * { margin:0; padding:0; box-sizing:border-box; }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; padding: 0; overflow-x: hidden; }
        [data-placeholder]:empty:before { content: attr(data-placeholder); color: #bbb; pointer-events: none; position: absolute; }
        h2 { letter-spacing: -0.3px; }
        .icon-chip { width:29px;height:29px;display:grid;place-items:center;border-radius:9px; }
        .icon-chip.cyan { color:#087f80;background:#d9f5f2; }
        .icon-chip.yellow { color:#a66d00;background:#fff0bd; }
        .icon-chip.green { color:#347b60;background:#dff1e8; }
        .icon-chip.orange { color:#b45a28;background:#fae5d7; }
        .action-icon { width:39px;height:39px;display:grid;place-items:center;border-radius:50%; }
        .action-icon.cyan { color:#087f80;background:#d9f5f2; }
        .action-icon.purple { color:#87568d;background:#f1e4f3; }
        .action-icon.green { color:#347b60;background:#dff1e8; }
        .action-icon.orange { color:#b45a28;background:#fae5d7; }
        @keyframes wave { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-10deg)} 60%{transform:rotate(14deg)} 80%{transform:rotate(-8deg)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes screenIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .screen-enter { animation: screenIn 0.28s ease both; }
        .login-screen {
          position:relative;display:grid;place-items:center;min-height:100vh;
          padding:clamp(60px,14vh,120px) 24px 30px;overflow:hidden;color:white;
          background: linear-gradient(155deg,rgba(76,2,23,.18),rgba(80,0,25,.45)), radial-gradient(circle at 23% 12%,#d33f5e,transparent 37%), linear-gradient(150deg,#9f1239 0%,#6e082b 52%,#3d061f 100%);
        }
        .login-screen::before { content:"";position:absolute;inset:0;opacity:.1;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.4'/%3E%3C/svg%3E"); }
        .login-orb { position:absolute;border:1px solid rgba(255,255,255,.1);border-radius:50%; }
        .orb-one { width:260px;height:260px;top:-110px;right:-95px;animation:wallpaperRotate 22s linear infinite; }
        .orb-two { width:170px;height:170px;bottom:-85px;left:-80px;animation:wallpaperRotate 18s linear infinite reverse; }
        @keyframes wallpaperRotate { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .login-card { position:relative;z-index:1;width:100%;max-width:420px;padding:32px 20px 28px;border:1px solid rgba(255,255,255,.18);border-radius:28px;background:rgba(255,255,255,.1);box-shadow:0 28px 60px rgba(44,0,18,.28);backdrop-filter:blur(18px); }
        .wordmark { font:800 21px/1 "Manrope",sans-serif;letter-spacing:-1.3px;color:#19161b; }
        .wordmark span:first-child { display:inline-grid;place-items:center;width:18px;height:18px;margin-right:1px;border:2px solid currentColor;border-radius:50%;font-size:0;transform:translateY(2px); }
        .wordmark span:first-child::after { content:"";width:5px;height:5px;background:#45ded9;border-radius:50%; }
        .wordmark .wordmark-dot { color:#45ded9; }
        .wordmark-light { color:white; }
        .login-heading { margin-bottom:24px;text-align:center; }
        .login-heading p { margin:0 0 4px;font:800 11px/1.2 "Manrope",sans-serif;letter-spacing:2.2px;text-transform:uppercase;opacity:.7; }
        .login-heading h1 { margin:0;font:800 22px/1.1 "Manrope",sans-serif;letter-spacing:-0.5px; }
        .field-group { margin-top:18px; }
        .field-group label { display:block;margin:0 0 8px 2px;font:700 10px/1 "Manrope",sans-serif;letter-spacing:1.7px;text-transform:uppercase; }
        .field-group input { width:100%;height:52px;border:0;border-radius:14px;padding:0 16px;color:#241d21;background:rgba(255,255,255,.95);font-family:inherit;font-size:14px;outline:none; }
        .input-wrap { position:relative; }
        .input-wrap input { padding-right:65px; }
        .input-wrap button { position:absolute;top:0;right:12px;height:52px;border:0;color:#817578;background:transparent;font-size:11px;font-weight:700;cursor:pointer; }
        .forgot { display:block;margin:10px 2px 22px auto;padding:0;border:0;color:rgba(255,255,255,.8);background:transparent;font-size:12px;font-weight:600;cursor:pointer; }
        .primary-button { display:flex;align-items:center;justify-content:center;gap:8px;width:160px;height:52px;border:0;border-radius:14px;color:white;background:#171418;box-shadow:0 13px 25px rgba(28,4,12,.28);font:700 14px "Manrope",sans-serif;cursor:pointer;transition:transform .2s;margin:0 auto; }
        .primary-button:hover { transform:translateY(-1px); }
        .signup-copy { margin:20px 0 0;color:rgba(255,255,255,.65);text-align:center;font-size:12px; }
        .signup-copy button { padding:0;border:0;color:#54eee7;background:transparent;font-weight:700;cursor:pointer; }
      `}</style>

      {screen === "login" && <LoginScreen onLogin={handleLogin} />}
      {screen === "dashboard" && (
        <DashboardScreen onNavigate={setScreen} headerProps={headerProps} notes={notes} uploads={uploads} links={links} />
      )}
      {screen === "notes" && (
        <NotesListScreen onNavigate={setScreen} headerProps={headerProps} notes={notes}
          onNewNote={createNote} onOpenNote={openNote} onDeleteNote={deleteNote} />
      )}
      {screen === "note-editor" && activeNote && (
        <NoteEditorScreen onNavigate={setScreen} headerProps={headerProps} note={activeNote} onSave={saveNote} />
      )}
      {screen === "uploads" && (
        <UploadsScreen onNavigate={setScreen} headerProps={headerProps} files={uploads}
          onAddFiles={addUploadFiles} onDeleteFile={deleteUpload} />
      )}
      {screen === "capture" && <CaptureScreen onNavigate={setScreen} headerProps={headerProps} />}
      {screen === "links" && (
        <LinksScreen onNavigate={setScreen} headerProps={headerProps} links={links}
          onAddLink={addLink} onDeleteLink={deleteLink} onRenameLink={renameLink} />
      )}

      {drawerOpen && (
        <AccountDrawer user={user} onLogout={handleLogout} onClose={() => setDrawerOpen(false)}
          onUpdateAvatar={handleUpdateAvatar} darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)} />
      )}
    </>
  );
}
