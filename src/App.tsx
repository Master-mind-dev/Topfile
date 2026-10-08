import {
  ChangeEvent, FormEvent, ReactNode, useRef,
  useState, useEffect
} from "react";
import * as api from './lib/api';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import NoteEditor, { type Note as EditorNote, type NoteAttachment } from './components/NoteEditor';
import Scanner, { type ScannedPage } from './components/Scanner';
import FileViewer, { type ViewableFile } from './components/FileViewer';
import FileManager, { type ExtFile } from './components/FileManager';
import ConnectedKnowledge from './components/ConnectedKnowledge';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Screen = "login" | "dashboard" | "notes" | "note-editor" | "uploads" | "capture" | "links" | "knowledge";

interface NoteBlock {
  id: string;
  type: "text" | "image" | "video" | "attachment";
  html?: string;
  src?: string;
  attachment?: NoteAttachment;
}

export interface Note {
  id: string;
  title: string;
  tags: string[];
  blocks: NoteBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface UploadFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uri: string;
  file?: File;
  addedAt: string;
  isFavorite?: boolean;
  lastOpenedAt?: string;
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
const KEYS = {
  notes: "ownly_notes_v2",
  uploads: "ownly_uploads_v2",
  links: "ownly_links_v2",
  user: "ownly_user",
  dark: "ownly_dark_mode"
};

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, val: T) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// ─── ICON COMPONENT ───────────────────────────────────────────────────────────
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
      alignItems: "center", minHeight: 60,
      padding: "calc(env(safe-area-inset-top) + 6px) 16px 6px",
      background: "var(--bg-header)", borderBottom: "1px solid var(--border-color)",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      transition: "background 0.2s, border-color 0.2s"
    }}>
      {/* Left: back button or spacer */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {showBack && (
          <button onClick={onBack} style={iconBtnStyle} title="Back">
            <Icon name="arrow-left" size={22} />
          </button>
        )}
      </div>

      {/* Center: page title */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2 }}>
        <strong style={{ fontFamily: "Manrope, sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: -0.2, color: "var(--text-primary)" }}>{title}</strong>
        <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 500 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Right: user icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
        {rightExtra}
        <button onClick={onOpenAccount} aria-label="Open account" style={{
          ...iconBtnStyle, width: 36, height: 36, borderRadius: "50%",
          background: avatarBg, color: "#fff", fontWeight: 800, fontSize: 13,
          fontFamily: "Manrope, sans-serif", position: "relative"
        }} title="Profile">
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
  color: "var(--text-primary)", transition: "background 0.15s"
};

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
const navItems: { label: string; icon: IconName; screen: Screen }[] = [
  { label: "Home",      icon: "home",   screen: "dashboard" },
  { label: "Notes",     icon: "note",   screen: "notes" },
  { label: "Uploads",   icon: "upload", screen: "uploads" },
  { label: "Scan",      icon: "camera", screen: "capture" },
  { label: "Knowledge", icon: "link",   screen: "knowledge" },
];

function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      height: `calc(64px + env(safe-area-inset-bottom))`,
      display: "grid", gridTemplateColumns: "repeat(5,1fr)",
      padding: "6px 4px env(safe-area-inset-bottom)",
      background: "var(--bg-nav)", borderTop: "1px solid var(--border-color)",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)", transition: "background 0.2s, border-color 0.2s"
    }}>
      {navItems.map(it => {
        const isActive = active === it.screen;
        return (
          <button key={it.screen} type="button" onClick={() => onNavigate(it.screen)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 3, border: "none", background: "transparent",
              cursor: "pointer", fontSize: 9, fontWeight: 700, fontFamily: "Manrope, sans-serif",
              color: isActive ? "#b2213d" : "var(--text-secondary)", transition: "color 0.15s"
            }}>
            <span style={{
              width: 36, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 10, background: isActive ? "rgba(178,33,61,0.15)" : "transparent",
              color: isActive ? "#b2213d" : "inherit",
              transition: "background 0.15s, color 0.15s"
            }}>
              <Icon name={it.icon} size={20} />
            </span>
            {it.label}
          </button>
        );
      })}
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
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: "82%", maxWidth: 360,
        background: "var(--bg-card)", color: "var(--text-primary)", display: "flex", flexDirection: "column",
        boxShadow: "-16px 0 60px rgba(0,0,0,0.35)", transition: "background 0.2s"
      }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(150deg,#9f1239,#6e082b)", padding: "calc(env(safe-area-inset-top) + 36px) 24px 24px", color: "#fff", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: `calc(env(safe-area-inset-top) + 12px)`, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
            <Icon name="x" size={18} />
          </button>

          {/* Editable avatar */}
          <div style={{ position: "relative", width: 64, height: 64, marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, fontFamily: "Manrope,sans-serif", overflow: "hidden", cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%", background: "#fff", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9f1239" }}>
              <Icon name="edit" size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>

          <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "Manrope,sans-serif" }}>{user?.name || "User"}</div>
          <div style={{ opacity: 0.75, fontSize: 13, marginTop: 2 }}>{user?.email || "—"}</div>
          <div style={{ marginTop: 8, display: "inline-block", background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>{user?.plan || "Personal Pro"}</div>
        </div>

        {/* Settings */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Dark Mode</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Toggle dark appearance</div>
            </div>
            <button onClick={toggleDark} style={{
              width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
              background: darkMode ? "#9f1239" : "#ddd", position: "relative", transition: "background 0.2s"
            }}>
              <span style={{ position: "absolute", top: 3, left: darkMode ? 23 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s", display: "block" }} />
            </button>
          </div>
          {[{ label: "Full Name", val: user?.name }, { label: "Email Address", val: user?.email }].map(row => (
            <div key={row.label} style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{row.label}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{row.val || "—"}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 24px", paddingBottom: `calc(16px + env(safe-area-inset-bottom))` }}>
          <button onClick={onLogout} style={{ width: "100%", padding: 14, background: "#d33f5e", color: "#fff", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "Manrope,sans-serif" }}>
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
function DashboardScreen({ onNavigate, headerProps, notes, uploads, links, onOpenNote }: {
  onNavigate: (s: Screen) => void;
  headerProps: HeaderProps;
  notes: Note[]; uploads: UploadFile[]; links: SavedLink[];
  onOpenNote: (id: string) => void;
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
    <main style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)", paddingBottom: 80, transition: "background 0.2s" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top) + 20px) 18px 20px" }}>
        {/* Greeting & Profile */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, fontFamily: "Manrope,sans-serif", letterSpacing: 2, textTransform: "uppercase", color: "#9d1d42" }}>{greeting}</p>
            <h1 style={{ margin: "6px 0 4px", fontFamily: "Manrope,sans-serif", fontSize: 23, fontWeight: 800, letterSpacing: -0.6, color: "var(--text-primary)" }}>
              Hey, {firstName} <span style={{ display: "inline-block", animation: "wave 1.5s ease-in-out 1" }}>👋</span>
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Ready for another focused session?</p>
          </div>
          
          <button onClick={headerProps.onOpenAccount} aria-label="Open account" style={{
            width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
            background: headerProps.user?.avatarUrl ? "transparent" : "#9f1239", color: "#fff", 
            fontWeight: 800, fontSize: 15, fontFamily: "Manrope, sans-serif", position: "relative",
            boxShadow: "var(--shadow-card)", display: "flex", alignItems: "center", justifyContent: "center"
          }} title="Profile">
            {headerProps.user?.avatarUrl ? (
              <img src={headerProps.user.avatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
            ) : (headerProps.user?.name ? headerProps.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?")}
            <span style={{ position: "absolute", right: 2, bottom: 2, width: 10, height: 10, borderRadius: "50%", background: "#4fe2d9", border: "2px solid #fff" }} />
          </button>
        </div>

        {/* Search */}
        <label style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--bg-card)", borderRadius: 14, padding: "0 14px", height: 48,
          border: "1px solid var(--border-color)", marginBottom: 20, boxShadow: "var(--shadow-card)",
          color: "var(--text-primary)", transition: "background 0.2s, border-color 0.2s"
        }}>
          <Icon name="search" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes, tags…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "var(--text-primary)" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><Icon name="x" size={16} /></button>}
        </label>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
          {stats.map(s => (
            <button key={s.label} onClick={() => onNavigate(s.screen)} style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px 10px 11px",
              border: "1px solid var(--border-subtle)", borderRadius: 16, background: "var(--bg-card)",
              boxShadow: "var(--shadow-card)", cursor: "pointer", transition: "transform 0.15s, background 0.2s"
            }}>
              <span className={`icon-chip ${s.color}`} style={{ marginBottom: 10 }}><Icon name={s.icon} size={18} /></span>
              <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{s.count}</strong>
              <span style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "Manrope,sans-serif", fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>Quick actions</h2>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", fontSize: 10 }}>
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
                border: "1px solid var(--border-subtle)", borderRadius: 15, background: "var(--bg-card)",
                fontSize: 9, fontWeight: 700, fontFamily: "Manrope,sans-serif", cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s, background 0.2s", color: "var(--text-primary)"
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
            <h2 style={{ margin: 0, fontFamily: "Manrope,sans-serif", fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>Recent notes</h2>
            <button onClick={() => setViewAll(v => !v)} style={{ border: "none", background: "none", cursor: "pointer", color: "#9f1239", fontWeight: 700, fontSize: 12, fontFamily: "Manrope,sans-serif" }}>
              {viewAll ? "Show less" : "View all"}
            </button>
          </div>
          {shown.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: 14 }}>
              {search ? `No notes matching "${search}"` : "No notes yet. Create your first note!"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {shown.map(note => (
                <button key={note.id} onClick={() => onOpenNote(note.id)} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12,
                  padding: 12, border: "1px solid var(--border-subtle)", borderRadius: 16,
                  background: "var(--bg-card)", textAlign: "left", cursor: "pointer", boxShadow: "var(--shadow-card)",
                  transition: "background 0.2s"
                }}>
                  <span style={{ width: 46, height: 50, borderRadius: 11, background: "rgba(159,18,57,0.12)", color: "#9f1239", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="note" size={22} />
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    {note.tags && note.tags.length > 0 && (
                      <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {note.tags.slice(0, 2).map(t => (
                          <span key={t} style={{ padding: "2px 7px", borderRadius: 10, background: "rgba(159,18,57,0.15)", color: "#b2213d", fontSize: 9, fontWeight: 700, fontFamily: "Manrope,sans-serif" }}>{t}</span>
                        ))}
                      </span>
                    )}
                    <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>{note.title || "Untitled Note"}</strong>
                    <small style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--text-secondary)", fontSize: 9 }}>
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
    <main style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)", paddingBottom: 80, transition: "background 0.2s" }}>
      <AppHeader title="Notes" screen="notes" {...headerProps}
        rightExtra={
          <button onClick={onNewNote} style={{ ...iconBtnStyle, color: "#9f1239" }} aria-label="New note" title="New note">
            <Icon name="plus" size={22} />
          </button>
        }
      />

      <div style={{ padding: "16px 18px" }}>
        {/* Search */}
        <label style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--bg-card)", borderRadius: 14, padding: "0 14px", height: 46,
          border: "1px solid var(--border-color)", marginBottom: 16, boxShadow: "var(--shadow-card)",
          color: "var(--text-primary)", transition: "background 0.2s, border-color 0.2s"
        }}>
          <Icon name="search" size={17} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes by title or tags…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><Icon name="x" size={14} /></button>}
        </label>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "var(--text-muted)" }}>
            <Icon name="note" size={48} />
            <p style={{ marginTop: 12 }}>{search ? `No notes matching "${search}"` : "No notes yet."}</p>
            <button onClick={onNewNote} style={{ marginTop: 12, padding: "10px 24px", background: "#9f1239", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
              Create your first note
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(note => {
              const textBlock = (note.blocks || []).find(b => b.type === "text" && b.html);
              const preview = textBlock?.html ? textBlock.html.replace(/<[^>]+>/g, "").slice(0, 100) : "No text content yet…";
              return (
                <div key={note.id} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", overflow: "hidden", transition: "background 0.2s" }}>
                  <button onClick={() => onOpenNote(note.id)} style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 15, fontWeight: 700, flex: 1, marginRight: 8, color: "var(--text-primary)" }}>{note.title || "Untitled Note"}</strong>
                      <span style={{ fontSize: 10, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {note.tags && note.tags.length > 0 && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                        {note.tags.map(t => (
                          <span key={t} style={{ padding: "2px 8px", borderRadius: 10, background: "rgba(159,18,57,0.15)", color: "#b2213d", fontSize: 10, fontWeight: 700, fontFamily: "Manrope,sans-serif" }}>{t}</span>
                        ))}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{preview}</p>
                  </button>
                  {/* Small icon row */}
                  <div style={{ borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end", padding: "6px 12px", gap: 8 }}>
                    <button onClick={() => onOpenNote(note.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9f1239", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}>
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
  const [saved, setSaved] = useState(true);
  const [blocks, setBlocks] = useState<NoteBlock[]>(
    note.blocks && note.blocks.length ? note.blocks : [{ id: "b1", type: "text", html: "" }]
  );

  const editorRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const activeBlockRef = useRef<string | null>(null);
  const idCounter = useRef(1000);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uid = () => `b-${idCounter.current++}-${Date.now()}`;

  function setRef(el: HTMLDivElement | null, blockId: string, initialHtml: string) {
    if (el && !editorRefs.current.has(blockId)) {
      editorRefs.current.set(blockId, el);
      el.innerHTML = initialHtml || "";
    } else if (el) {
      editorRefs.current.set(blockId, el);
    }
  }

  function collectAndSave(currentTitle: string, currentTags: string[], currentBlocks: NoteBlock[]) {
    const updatedBlocks = currentBlocks.map(b => {
      if (b.type === "text") {
        const el = editorRefs.current.get(b.id);
        return el ? { ...b, html: el.innerHTML } : b;
      }
      return b;
    });
    onSave({ ...note, title: currentTitle, tags: currentTags, blocks: updatedBlocks, updatedAt: new Date().toISOString() });
    setSaved(true);
  }

  function scheduleSave(t: string, tg: string[], bl: NoteBlock[]) {
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => collectAndSave(t, tg, bl), 800);
  }

  function markDirty() { scheduleSave(title, tags, blocks); }

  // Execute rich text formatting (bold, italic, underline, headings, lists, quotes)
  function formatText(cmd: string, val?: string) {
    const targetId = activeBlockRef.current || blocks.find(b => b.type === "text")?.id;
    const el = targetId ? editorRefs.current.get(targetId) : null;
    if (!el) return;

    // Check if selection exists inside this block
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
      el.focus();
    }

    if (cmd === "formatBlock" && val) {
      // In modern browsers, formatBlock expects <tagName> like <h1> or <h2> or <blockquote>
      document.execCommand("formatBlock", false, `<${val}>`);
    } else {
      document.execCommand(cmd, false, val);
    }
    markDirty();
  }

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,/g, "");
      if (t && !tags.includes(t)) {
        const newTags = [...tags, t];
        setTags(newTags);
        scheduleSave(title, newTags, blocks);
      }
      setTagInput("");
    }
  }

  function removeTag(t: string) {
    const newTags = tags.filter(x => x !== t);
    setTags(newTags);
    scheduleSave(title, newTags, blocks);
  }

  function addImageBlock(file: File) {
    const src = URL.createObjectURL(file);
    const imgBlock: NoteBlock = { id: uid(), type: "image", src };
    const textBlock: NoteBlock = { id: uid(), type: "text", html: "" };
    const newBlocks = [...blocks, imgBlock, textBlock];
    setBlocks(newBlocks);
    scheduleSave(title, tags, newBlocks);
  }

  function addVideoBlock(file: File) {
    const src = URL.createObjectURL(file);
    const vidBlock: NoteBlock = { id: uid(), type: "video", src };
    const textBlock: NoteBlock = { id: uid(), type: "text", html: "" };
    const newBlocks = [...blocks, vidBlock, textBlock];
    setBlocks(newBlocks);
    scheduleSave(title, tags, newBlocks);
  }

  function deleteBlock(id: string) {
    editorRefs.current.delete(id);
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    scheduleSave(title, tags, newBlocks);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--note-bg)", color: "var(--text-primary)", paddingBottom: 120, transition: "background 0.2s" }}>
      <AppHeader title="Note" screen="note-editor" onBack={() => onNavigate("notes")} {...headerProps}
        rightExtra={
          <span style={{ fontSize: 11, color: saved ? "#4caf50" : "#ff9800", fontWeight: 800, fontFamily: "Manrope,sans-serif" }}>
            {saved ? "✓ Saved" : "Saving…"}
          </span>
        }
      />

      <div style={{ padding: "16px 18px" }}>
        {/* Note Title */}
        <input value={title} onChange={e => { setTitle(e.target.value); scheduleSave(e.target.value, tags, blocks); }}
          placeholder="Note title…" style={{
            width: "100%", border: "none", outline: "none", fontSize: 24, fontWeight: 800,
            fontFamily: "Manrope, sans-serif", background: "transparent", marginBottom: 12,
            letterSpacing: -0.6, boxSizing: "border-box", color: "var(--text-primary)"
          }} />

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, alignItems: "center" }}>
          {tags.map(t => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "#9f1239", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "Manrope,sans-serif" }}>
              {t}
              <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", padding: 0 }}>
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
            placeholder="+ Add tag (Enter)"
            style={{ border: "1px dashed var(--border-color)", borderRadius: 20, padding: "4px 12px", fontSize: 12, outline: "none", background: "var(--bg-card)", color: "var(--text-primary)", minWidth: 120 }} />
        </div>

        {/* Formatting Toolbar */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", padding: "10px 0",
          borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)",
          marginBottom: 16, scrollbarWidth: "none"
        }}>
          {([
            { cmd: "bold", label: "B", title: "Bold" },
            { cmd: "italic", label: "I", title: "Italic" },
            { cmd: "underline", label: "U", title: "Underline" },
          ]).map(f => (
            <button key={f.cmd} type="button" title={f.title}
              onMouseDown={e => { e.preventDefault(); formatText(f.cmd); }}
              style={{
                minWidth: 38, height: 36, border: "1px solid var(--border-color)", borderRadius: 8,
                background: "var(--bg-card)", cursor: "pointer", fontWeight: 800, fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)",
                transition: "background 0.15s"
              }}>
              {f.cmd === "bold" ? <strong>B</strong> : f.cmd === "italic" ? <em style={{ fontStyle: "italic", fontFamily: "serif" }}>I</em> : <u>U</u>}
            </button>
          ))}

          <div style={{ width: 1, background: "var(--border-color)", margin: "4px 2px" }} />

          {([
            { label: "H1", cmd: "formatBlock", val: "h1", title: "Heading 1" },
            { label: "H2", cmd: "formatBlock", val: "h2", title: "Heading 2" },
            { label: "• List", cmd: "insertUnorderedList", val: undefined, title: "Bullet List" },
            { label: '" Quote', cmd: "formatBlock", val: "blockquote", title: "Blockquote" },
          ]).map(f => (
            <button key={f.label} type="button" title={f.title}
              onMouseDown={e => { e.preventDefault(); formatText(f.cmd, f.val); }}
              style={{
                minWidth: 44, height: 36, border: "1px solid var(--border-color)", borderRadius: 8,
                background: "var(--bg-card)", cursor: "pointer", fontSize: 12, fontWeight: 800,
                fontFamily: "Manrope,sans-serif", whiteSpace: "nowrap", padding: "0 10px",
                color: "var(--text-primary)", transition: "background 0.15s"
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Samsung Notes Blocks (Text, Images, Videos) */}
        <div>
          {blocks.map((block, idx) => {
            if (block.type === "text") {
              return (
                <div
                  key={block.id}
                  ref={el => setRef(el, block.id, block.html || "")}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => { activeBlockRef.current = block.id; }}
                  onInput={markDirty}
                  data-placeholder={idx === 0 ? "Start typing your note here…" : "Continue writing…"}
                  dir="ltr"
                  className="note-text-block"
                  style={{
                    minHeight: 48, outline: "none", fontSize: 15, lineHeight: 1.7,
                    color: "var(--text-primary)", fontFamily: "DM Sans, sans-serif",
                    position: "relative", direction: "ltr", textAlign: "left",
                    unicodeBidi: "plaintext"
                  }}
                />
              );
            } else if (block.type === "image") {
              return (
                <div key={block.id} style={{ margin: "14px 0", position: "relative", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                  <img src={block.src} alt="" style={{ width: "100%", display: "block", borderRadius: 14 }} />
                  <button onClick={() => deleteBlock(block.id)} style={{
                    position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(0,0,0,0.7)", border: "none", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", color: "#fff"
                  }} title="Remove image"><Icon name="x" size={16} /></button>
                </div>
              );
            } else {
              return (
                <div key={block.id} style={{ margin: "14px 0", position: "relative", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                  <video src={block.src} controls style={{ width: "100%", borderRadius: 14, display: "block" }} />
                  <button onClick={() => deleteBlock(block.id)} style={{
                    position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(0,0,0,0.7)", border: "none", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", color: "#fff"
                  }} title="Remove video"><Icon name="x" size={16} /></button>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Fixed Bottom Action Toolbar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "var(--bg-nav)", borderTop: "1px solid var(--border-color)",
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", zIndex: 30,
        transition: "background 0.2s, border-color 0.2s"
      }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", cursor: "pointer", borderRadius: 10, background: "var(--bg-chip)", color: "var(--text-primary)", fontSize: 12, fontWeight: 700 }} title="Insert image">
          <Icon name="image" size={18} />
          <span>Image</span>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && addImageBlock(e.target.files[0])} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", cursor: "pointer", borderRadius: 10, background: "var(--bg-chip)", color: "var(--text-primary)", fontSize: 12, fontWeight: 700 }} title="Insert video">
          <Icon name="video" size={18} />
          <span>Video</span>
          <input type="file" accept="video/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && addVideoBlock(e.target.files[0])} />
        </label>
        <button onClick={() => { const nb: NoteBlock = { id: uid(), type: "text", html: "" }; const newBlocks = [...blocks, nb]; setBlocks(newBlocks); scheduleSave(title, tags, newBlocks); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", cursor: "pointer", borderRadius: 10, background: "var(--bg-chip)", border: "none", color: "var(--text-primary)", fontSize: 12, fontWeight: 700 }} title="Add text section">
          <Icon name="plus" size={18} />
          <span>Text</span>
        </button>
      </div>
    </main>
  );
}

// ─── UPLOADS SCREEN ───────────────────────────────────────────────────────────
function UploadsScreen({ onNavigate, headerProps, files, onAddFiles, onDeleteFile, onRenameFile }: {
  onNavigate: (s: Screen) => void; headerProps: HeaderProps;
  files: UploadFile[]; onAddFiles: (f: UploadFile[]) => void; onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [viewing, setViewing] = useState<UploadFile | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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
          ) : isPDF(viewing) ? (
            <iframe src={viewing.uri} title={viewing.name} style={{ width: "100%", height: "calc(100vh - 60px)", border: "none", background: "#fff" }} />
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
    <main style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)", paddingBottom: 80, transition: "background 0.2s" }}>
      <AppHeader title="Uploads" screen="uploads" {...headerProps}
        rightExtra={
          <label style={{ ...iconBtnStyle, cursor: "pointer" }} aria-label="Upload file" title="Upload file">
            <Icon name="plus" size={22} />
            <input type="file" multiple style={{ display: "none" }}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              onChange={handleAdd} />
          </label>
        }
      />

      <div style={{ padding: "16px 18px" }}>
        {/* Drop zone */}
        <label style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          padding: "24px 16px", background: "var(--bg-card)", border: "2px dashed var(--border-color)",
          borderRadius: 20, cursor: "pointer", marginBottom: 16, textAlign: "center",
          boxShadow: "var(--shadow-card)", transition: "background 0.2s"
        }}>
          <Icon name="upload" size={28} />
          <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 14, color: "var(--text-primary)" }}>Upload files</strong>
          <small style={{ color: "var(--text-secondary)", fontSize: 12 }}>PDF, Images, Word, Excel, Video, ZIP</small>
          <span style={{ padding: "6px 16px", background: "#9f1239", color: "#fff", borderRadius: 20, fontSize: 12, fontWeight: 700, marginTop: 4 }}>Browse files</span>
          <input type="file" multiple style={{ display: "none" }}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            onChange={handleAdd} />
        </label>

        {/* Search */}
        <label style={{
          display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)",
          borderRadius: 13, padding: "0 13px", height: 44, border: "1px solid var(--border-color)",
          marginBottom: 12, boxShadow: "var(--shadow-card)", color: "var(--text-primary)"
        }}>
          <Icon name="search" size={16} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search uploaded files…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }} />
          {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><Icon name="x" size={14} /></button>}
        </label>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16 }}>
          {["All", "Images", "PDF", "Docs", "Videos"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid var(--border-color)", cursor: "pointer",
              fontSize: 12, fontWeight: 700, fontFamily: "Manrope,sans-serif", whiteSpace: "nowrap",
              background: filter === f ? "#9f1239" : "var(--bg-card)",
              color: filter === f ? "#fff" : "var(--text-secondary)",
              boxShadow: "var(--shadow-card)", transition: "background 0.15s, color 0.15s"
            }}>{f}</button>
          ))}
        </div>

        {/* File list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            {query ? `No files matching "${query}"` : "No files uploaded yet."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(file => (
              <div key={file.id} onClick={() => setViewing(file)} style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12,
                padding: "12px 14px", background: "var(--bg-card)", borderRadius: 14, cursor: "pointer",
                border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)",
                transition: "transform 0.12s, background 0.2s"
              }}>
                <span style={{
                  width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: isImage(file) ? "rgba(8,127,128,0.15)" : isPDF(file) ? "rgba(159,18,57,0.15)" : isVideo(file) ? "rgba(135,86,141,0.15)" : "rgba(166,109,0,0.15)",
                  color: isImage(file) ? "#087f80" : isPDF(file) ? "#b2213d" : isVideo(file) ? "#87568d" : "#a66d00"
                }}>
                  <Icon name={isImage(file) ? "image" : isVideo(file) ? "video" : "file"} size={20} />
                </span>

                <div style={{ minWidth: 0 }}>
                  {editingId === file.id ? (
                    <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (onRenameFile(file.id, editName.trim() || file.name), setEditingId(null))}
                        style={{ flex: 1, border: "1px solid #9f1239", borderRadius: 6, padding: "4px 8px", fontSize: 13, outline: "none", color: "var(--text-primary)", background: "var(--bg-card)" }} />
                      <button onClick={() => { onRenameFile(file.id, editName.trim() || file.name); setEditingId(null); }}
                        style={{ background: "#9f1239", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓</button>
                    </div>
                  ) : (
                    <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 13, fontWeight: 700, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)" }}>{file.name}</strong>
                  )}
                  <small style={{ color: "var(--text-secondary)", fontSize: 10, marginTop: 2, display: "block" }}>{file.size} &bull; {new Date(file.addedAt).toLocaleDateString()}</small>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditingId(file.id); setEditName(file.name); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }}>Rename</button>
                  <button onClick={() => onDeleteFile(file.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#e05" }} title="Delete">
                    <Icon name="trash" size={15} />
                  </button>
                </div>
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
  const [phase, setPhase] = useState<"idle" | "done">("idle");
  const [preview, setPreview] = useState<string | null>(null);

  function handleCapture(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setPreview(URL.createObjectURL(f)); setPhase("done"); }
  }

  function savePDF() {
    alert("Document saved to your Uploads list!");
    onNavigate("uploads");
  }

  function reset() { setPhase("idle"); setPreview(null); }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)", paddingBottom: 80, transition: "background 0.2s" }}>
      <AppHeader title="Capture" screen="capture" {...headerProps} />

      <div style={{ padding: "20px 18px" }}>
        {/* Header card */}
        <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 20, background: "linear-gradient(150deg,#9f1239,#6e082b)", color: "#fff", padding: "20px 20px 16px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              {phase === "done" ? "✓ Complete" : "✦ Document Scanner"}
            </span>
          </div>
          <h2 style={{ margin: "0 0 6px", fontFamily: "Manrope,sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>
            {phase === "done" ? "Document captured!" : "Scan your document"}
          </h2>
          <p style={{ margin: 0, opacity: 0.85, fontSize: 13 }}>
            {phase === "done" ? "Your document is ready. Save it as PDF or retake." : "Use your camera to snap high quality documents, receipts, or notes."}
          </p>
        </div>

        {/* Idle */}
        {phase === "idle" && (
          <>
            <div style={{ borderRadius: 20, background: "var(--bg-card)", border: "1px solid var(--border-color)", aspectRatio: "4/3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 18, boxShadow: "var(--shadow-card)" }}>
              <Icon name="camera" size={48} />
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>Ready to scan document</p>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center" }}>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 20px", borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border-color)", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", boxShadow: "var(--shadow-card)" }}>
                <Icon name="image" size={24} /> Gallery
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCapture} />
              </label>
              <label style={{ width: 72, height: 72, borderRadius: "50%", background: "#9f1239", border: "4px solid #fff", boxShadow: "0 4px 20px rgba(159,18,57,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }} title="Take Photo">
                <Icon name="camera" size={28} />
                <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleCapture} />
              </label>
            </div>
          </>
        )}

        {/* Done */}
        {phase === "done" && (
          <div>
            {preview && <img src={preview} alt="" style={{ width: "100%", borderRadius: 16, marginBottom: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }} />}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={reset} style={{ flex: 1, padding: "14px", borderRadius: 14, border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-primary)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
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
    <main style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)", paddingBottom: 80, transition: "background 0.2s" }}>
      <AppHeader title="Links" screen="links" {...headerProps} />

      <div style={{ padding: "16px 18px" }}>
        {/* Add link card */}
        <form onSubmit={addLink} style={{
          background: "var(--bg-card)", borderRadius: 18, padding: "16px", marginBottom: 16,
          border: "1px solid var(--border-color)", boxShadow: "var(--shadow-card)", transition: "background 0.2s"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(159,18,57,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#9f1239" }}>
              <Icon name="link" size={18} />
            </div>
            <div>
              <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Save a link</strong>
              <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)" }}>YouTube, articles, any URL</p>
            </div>
          </div>
          <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Custom title (optional)"
            style={{ width: "100%", border: "1px solid var(--border-color)", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit", background: "var(--bg-input)", color: "var(--text-primary)" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste URL or YouTube link…" type="url"
              style={{ flex: 1, border: "1px solid var(--border-color)", borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", background: "var(--bg-input)", color: "var(--text-primary)" }} />
            <button type="submit" style={{ padding: "9px 18px", background: "#9f1239", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Manrope,sans-serif" }}>
              Save
            </button>
          </div>
        </form>

        {/* Search */}
        <label style={{
          display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)",
          borderRadius: 13, padding: "0 13px", height: 44, border: "1px solid var(--border-color)",
          marginBottom: 16, boxShadow: "var(--shadow-card)", color: "var(--text-primary)"
        }}>
          <Icon name="search" size={16} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search saved links…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }} />
          {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><Icon name="x" size={14} /></button>}
        </label>

        {/* Links grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            {query ? `No links matching "${query}"` : "No links saved yet."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(link => {
              const ytId = getYouTubeId(link.url);
              const isYT = !!ytId;
              const thumb = link.thumb || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null);

              return (
                <article key={link.id} style={{ background: "var(--bg-card)", borderRadius: 18, overflow: "hidden", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", transition: "background 0.2s" }}>
                  {/* Thumbnail / Embed */}
                  <div style={{ width: "100%", height: 200, background: "var(--bg-chip)", position: "relative", cursor: "pointer" }}
                    onClick={() => window.open(link.url, "_blank")}>
                    {thumb ? (
                      <img src={thumb} alt={link.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={e => (e.currentTarget.parentElement!.style.background = "var(--bg-chip)")} />
                    ) : (
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-secondary)" }}>
                        <Icon name="external" size={36} />
                        <small style={{ fontSize: 12, color: "var(--text-secondary)" }}>{link.url.replace(/^https?:\/\//, "").split("/")[0]}</small>
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
                          style={{ flex: 1, border: "1px solid #9f1239", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none", fontFamily: "inherit", background: "var(--bg-card)", color: "var(--text-primary)" }} />
                        <button onClick={() => { onRenameLink(link.id, editTitle); setEditingId(null); }}
                          style={{ background: "#9f1239", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓</button>
                      </div>
                    ) : (
                      <strong style={{ fontFamily: "Manrope,sans-serif", fontSize: 14, fontWeight: 700, display: "block", lineHeight: 1.4, marginBottom: 4, color: "var(--text-primary)" }}>{link.title}</strong>
                    )}
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: "55%", whiteSpace: "nowrap" }}>
                        {link.url.replace(/^https?:\/\//, "").split("/")[0]}
                      </span>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={() => { setEditingId(link.id); setEditTitle(link.title); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9f1239", fontSize: 11, fontWeight: 700 }}>Rename</button>
                        <button onClick={() => window.open(link.url, "_blank")}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 11 }}>Open ↗</button>
                        <button onClick={() => onDeleteLink(link.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#e05" }} title="Delete">
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
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem("ownly_dark_mode") === "true");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Scanner & file-viewer overlay state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<ViewableFile | null>(null);

  // Persist on change
  useEffect(() => { save(KEYS.notes, notes); }, [notes]);
  useEffect(() => { save(KEYS.links, links); }, [links]);
  useEffect(() => { if (user) save(KEYS.user, user); }, [user]);

  // Dark mode class sync on HTML and BODY
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("dark-mode");
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("ownly_dark_mode", String(darkMode));
  }, [darkMode]);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("ownly_auth_token");
    if (token) {
      setScreen("dashboard");
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

  // Scanner → note integration
  function handleScanInsert(pages: ScannedPage[], pdfUri?: string) {
    setScannerOpen(false);
    if (!activeNoteId) return;
    const newBlocks: NoteBlock[] = pages.map(p => ({
      id: `img-${Date.now()}-${Math.random()}`,
      type: "image" as const,
      src: p.enhanced || p.uri,
    }));
    if (pdfUri) {
      const att: NoteAttachment = {
        id: `att-${Date.now()}`, name: "Scanned_Document.pdf",
        type: "application/pdf", size: "—", uri: pdfUri, addedAt: new Date().toISOString(),
      };
      newBlocks.push({ id: `att-blk-${Date.now()}`, type: "attachment", attachment: att });
    }
    setNotes(prev => prev.map(n => n.id === activeNoteId
      ? { ...n, blocks: [...n.blocks, ...newBlocks], updatedAt: new Date().toISOString() }
      : n));
  }

  // Uploads & Files
  function addUploadFiles(files: UploadFile[]) { setUploads(p => [...files, ...p]); }
  function deleteUpload(id: string) { setUploads(p => p.filter(f => f.id !== id)); }
  function renameUpload(id: string, name: string) { setUploads(p => p.map(f => f.id === id ? { ...f, name } : f)); }
  function duplicateUpload(file: ExtFile) {
    const newFile = { ...file, id: `f-${Date.now()}`, name: `Copy of ${file.name}`, addedAt: new Date().toISOString(), isFavorite: false };
    setUploads(p => [newFile, ...p]);
  }
  function toggleFavoriteUpload(id: string) {
    setUploads(p => p.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f));
  }
  function updateOpenedAt(id: string) {
    setUploads(p => p.map(f => f.id === id ? { ...f, lastOpenedAt: new Date().toISOString() } : f));
  }

  // Links
  function addLink(l: SavedLink) {
    setLinks(p => [l, ...p]);
    api.createLink({ url: l.url, title: l.title, description: l.description }).catch(() => {});
  }
  function deleteLink(id: string) { setLinks(p => p.filter(l => l.id !== id)); api.deleteLink(id).catch(() => {}); }
  function renameLink(id: string, title: string) { setLinks(p => p.map(l => l.id === id ? { ...l, title } : l)); }

  const headerProps: HeaderProps = {
    user,
    onOpenAccount: () => setDrawerOpen(true),
    onToggleDark: () => setDarkMode(d => !d),
    darkMode
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
      {/* Universal File Viewer overlay (highest z) */}
      {viewerFile && <FileViewer file={viewerFile} onBack={() => setViewerFile(null)} />}

      {/* Scanner overlay */}
      {scannerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400 }}>
          <Scanner
            onBack={() => setScannerOpen(false)}
            onInsertToNote={handleScanInsert}
          />
        </div>
      )}

      {screen === "login" && <LoginScreen onLogin={handleLogin} />}
      {screen === "dashboard" && (
        <DashboardScreen onNavigate={setScreen} headerProps={headerProps} notes={notes} uploads={uploads} links={links} onOpenNote={openNote} />
      )}
      {screen === "notes" && (
        <NotesListScreen onNavigate={setScreen} headerProps={headerProps} notes={notes}
          onNewNote={createNote} onOpenNote={openNote} onDeleteNote={deleteNote} />
      )}
      {screen === "note-editor" && activeNote && (
        <NoteEditor
          note={activeNote as EditorNote}
          onSave={saveNote as (n: EditorNote) => void}
          onBack={() => setScreen("notes")}
          onOpenScanner={() => setScannerOpen(true)}
          onOpenViewer={(att: NoteAttachment) => setViewerFile({ name: att.name, type: att.type, uri: att.uri, size: att.size })}
        />
      )}
      {screen === "uploads" && (
        <FileManager
          files={uploads}
          onBack={() => setScreen("dashboard")}
          onAddFiles={addUploadFiles}
          onDeleteFile={deleteUpload}
          onRenameFile={renameUpload}
          onDuplicateFile={duplicateUpload}
          onToggleFavorite={toggleFavoriteUpload}
          onUpdateOpenedAt={updateOpenedAt}
          onOpenViewer={(f: ExtFile) => setViewerFile({ name: f.name, type: f.type, uri: f.uri, size: f.size })}
        />
      )}
      {screen === "capture" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400 }}>
          <Scanner onBack={() => setScreen("dashboard")} onInsertToNote={(pages, pdfUri) => {
            if (pdfUri) {
              const newFile: UploadFile = { id: `f-${Date.now()}`, name: "Scanned_Document.pdf", size: "—", type: "application/pdf", uri: pdfUri, addedAt: new Date().toISOString() };
              addUploadFiles([newFile]);
            }
            setScreen("uploads");
          }} />
        </div>
      )}
      {screen === "links" && (
        <LinksScreen onNavigate={setScreen} headerProps={headerProps} links={links}
          onAddLink={addLink} onDeleteLink={deleteLink} onRenameLink={renameLink} />
      )}
      {screen === "knowledge" && (
        <ConnectedKnowledge onBack={() => setScreen("dashboard")} />
      )}

      {drawerOpen && (
        <AccountDrawer user={user} onLogout={handleLogout} onClose={() => setDrawerOpen(false)}
          onUpdateAvatar={handleUpdateAvatar} darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)} />
      )}
    </>
  );
}



