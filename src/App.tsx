import * as api from './lib/api';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { ChangeEvent, FormEvent, ReactNode, useState, useEffect } from "react";

type Screen = "login" | "dashboard" | "editor" | "uploads" | "capture" | "links";

type IconName =
  | "menu"
  | "arrow-left"
  | "arrow-right"
  | "book"
  | "camera"
  | "check"
  | "chevron-right"
  | "clock"
  | "file"
  | "flame"
  | "home"
  | "image"
  | "link"
  | "more"
  | "note"
  | "paperclip"
  | "plus"
  | "search"
  | "share"
  | "sparkle"
  | "upload";

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const paths: Record<IconName, ReactNode> = {
    "menu": <path d="M4 6h16M4 12h16M4 18h16" />,
    "arrow-left": <path d="m15 18-6-6 6-6" />,
    "arrow-right": <path d="m9 18 6-6-6-6" />,
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    camera: (
      <>
        <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h9l4 4v16H6Z" />
        <path d="M14 2v5h5M9 13h6M9 17h4" />
      </>
    ),
    flame: <path d="M12 22c4 0 7-3 7-7 0-3-1.5-5.5-4-8 .1 3-1.4 4-2.3 4.5.5-3.7-1.5-6.2-4-8.5.2 3.5-3.7 6.1-3.7 11.5C5 18.6 8 22 12 22Z" />,
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 15-4-4L5 20" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2A5 5 0 0 0 12 4l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    note: (
      <>
        <path d="M5 3h14v18H5Z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </>
    ),
    paperclip: <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 0 1-2.8-2.8l8.9-8.9" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
      </>
    ),
    sparkle: <path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7Z" />,
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M5 14v6h14v-6" />
      </>
    ),
  };

  function logout() {
    localStorage.removeItem('ownly_auth_token');
    setIsAuthenticated(false);
    setUser(null);
    setScreen('login');
    setDrawerOpen(false);
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      {paths[name]}
    </svg>
  );
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className={`wordmark ${light ? "wordmark-light" : ""}`} aria-label="OWNLY">
      <span>O</span>WNLY<span className="wordmark-dot">.</span>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await api.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen screen-enter">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <form className="login-card" onSubmit={submit}>
        <button onClick={onMenuClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="menu" size={24} /></button>
        <Wordmark light />

        <div className="login-heading">
          <p>Welcome back</p>
          <h1>Login</h1>
        </div>

        {error && <div style={{color: 'red', fontSize: '12px', marginTop: '10px'}}>{error}</div>}
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="field-group password-field">
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <input
              id="password"
              type={passwordVisible ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              type="button"
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button className="forgot" type="button">
          Forgot password?
        </button>

        <button className="primary-button" type="submit">
          Log in <Icon name="arrow-right" size={18} />
        </button>

        <p className="signup-copy">
          No account? <button type="button">Sign up</button>
        </p>
      </form>
    </main>
  );
}

const stats: { count: number; label: string; icon: IconName; color: string }[] = [
  { count: 24, label: "Notes", icon: "note", color: "cyan" },
  { count: 11, label: "Uploads", icon: "upload", color: "yellow" },
  { count: 7, label: "Scans", icon: "camera", color: "green" },
  { count: 18, label: "Links", icon: "link", color: "orange" },
];

const actions: { label: string; icon: IconName; color: string }[] = [
  { label: "New note", icon: "plus", color: "cyan" },
  { label: "Upload", icon: "upload", color: "purple" },
  { label: "Scan", icon: "camera", color: "green" },
  { label: "Add link", icon: "link", color: "orange" },
];

function BottomNav({
  active,
  onNavigate,
}: {
  active: "dashboard" | "notes" | "uploads" | "capture" | "links";
  onNavigate: (screen: Screen) => void;
}) {
  const items: { label: string; icon: IconName; key: string }[] = [
    { label: "Dashboard", icon: "home", key: "dashboard" },
    { label: "Notes", icon: "note", key: "notes" },
    { label: "Uploads", icon: "upload", key: "uploads" },
    { label: "Capture", icon: "camera", key: "capture" },
    { label: "Links", icon: "link", key: "links" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => (
        <button
          className={active === item.key ? "active" : ""}
          key={item.key}
          type="button"
          onClick={() => {
            if (item.key === "dashboard") onNavigate("dashboard");
            if (item.key === "notes") onNavigate("editor");
            if (item.key === "uploads") onNavigate("uploads");
            if (item.key === "capture") onNavigate("capture");
            if (item.key === "links") onNavigate("links");
          }}
        >
          <span className="nav-icon">
            <Icon name={item.icon} size={20} />
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function DashboardScreen({ onNavigate, onMenuClick, darkMode, toggleDark }: { onNavigate: (screen: Screen) => void, onMenuClick: () => void, darkMode: boolean, toggleDark: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewAll, setViewAll] = useState(false);
  return (
    <main className="app-screen screen-enter">
      <header className="topbar">
        <Wordmark light />
        <div className="topbar-title">
          <strong>Dashboard</strong>
          <span>Tuesday, Oct 15</span>
        </div>
        <button onClick={toggleDark} style={{ background: 'transparent', border: 'none', marginRight: 10 }}>{darkMode ? '☀️' : '🌙'}</button>
        <button className="avatar" type="button" aria-label="Open profile" onClick={onMenuClick}>
          AR
          <span />
        </button>
      </header>

      <div className="dashboard-content">
        <section className="greeting">
          <div>
            <p className="eyebrow">Good morning</p>
            <h1>
              Welcome back, Alex <span className="wave">👋</span>
            </h1>
            <p className="subcopy">Ready for another focused study session?</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: 12, padding: '0 10px', marginTop: 10 }}>
            <Icon name="search" size={19} color="#888" />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              style={{ border: 'none', padding: '10px', width: '100%', background: 'transparent', outline: 'none' }} 
            />
          </div>
        </section>

        <section className="stats-grid" aria-label="Library totals">
          {stats.map((stat) => (
            <button
              className="stat-card interactive-box"
              key={stat.label}
              type="button"
              onClick={() => {
                if (stat.label === "Notes") onNavigate("editor");
                if (stat.label === "Uploads") onNavigate("uploads");
                if (stat.label === "Scans") onNavigate("capture");
                if (stat.label === "Links") onNavigate("links");
              }}
            >
              <span className={`icon-chip ${stat.color}`}>
                <Icon name={stat.icon} size={18} />
              </span>
              <strong>{stat.count}</strong>
              <span>{stat.label}</span>
            </button>
          ))}
        </section>

        <section className="content-section">
          <div className="section-heading">
            <h2>Quick actions</h2>
            <div className="weekly">
              <Icon name="flame" size={15} /> 12 items this week
            </div>
          </div>
          <div className="actions-grid">
            {actions.map((action) => (
              <button
                className="action-card interactive-box"
                key={action.label}
                type="button"
                onClick={() => {
                  if (action.label === "New note") onNavigate("editor");
                  if (action.label === "Upload") onNavigate("uploads");
                  if (action.label === "Scan") onNavigate("capture");
                  if (action.label === "Add link") onNavigate("links");
                }}
              >
                <span className={`action-icon ${action.color}`}>
                  <Icon name={action.icon} size={21} />
                </span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <button className="review-banner" type="button" onClick={() => onNavigate("editor")}>
          <span className="sparkle-icon">
            <Icon name="sparkle" size={20} />
          </span>
          <span>
            <small>Ready to revisit?</small>
            <strong>Cell division is due for review</strong>
          </span>
          <Icon name="chevron-right" size={18} />
        </button>

        <section className="content-section recent-section">
          <div className="section-heading">
            <h2>Recent notes</h2>
            <button type="button" onClick={() => setViewAll(!viewAll)}>{viewAll ? "Show less" : "View all"}</button>
          </div>
          <div className="notes-list">
            <button className="note-card" type="button" onClick={() => onNavigate("editor")}>
              <span className="note-thumbnail biology">
                <Icon name="book" size={22} />
              </span>
              <span className="note-details">
                <span className="note-tag">Biology</span>
                <strong>Biology Chapter 4 — Cell Division</strong>
                <small>
                  <Icon name="clock" size={12} /> Edited 2h ago
                </small>
              </span>
              <Icon name="chevron-right" size={18} />
            </button>
            <button className="note-card" type="button">
              <span className="note-thumbnail history">
                <Icon name="file" size={22} />
              </span>
              <span className="note-details">
                <span className="note-tag history-tag">History</span>
                <strong>French Revolution Timeline</strong>
                <small>
                  <Icon name="clock" size={12} /> Edited yesterday
                </small>
              </span>
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        </section>
      </div>

      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </main>
  );
}

function EditorScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [saved, setSaved] = useState(true);

  return (
    <main className="app-screen editor-screen screen-enter">
      <header className="topbar">
        <Wordmark light />
        <div className="topbar-title">
          <strong>Notes</strong>
          <span>Private workspace</span>
        </div>
        <button className="more-button" type="button" aria-label="More actions">
          <Icon name="more" size={22} />
        </button>
      </header>

      <div className="editor-content">
        <div className="editor-nav">
          <button type="button" onClick={() => onNavigate("dashboard")}>
            <Icon name="arrow-left" size={18} /> All notes
          </button>
          <button className="share-button" type="button">
            <Icon name="share" size={17} /> Share
          </button>
        </div>

        <div className="format-toolbar" aria-label="Text formatting">
          <button type="button">
            <strong>B</strong>
          </button>
          <button type="button">
            <em>I</em>
          </button>
          <button type="button">
            <u>U</u>
          </button>
          <span />
          <button type="button">H2</button>
          <button type="button">≡</button>
          <button type="button">#</button>
        </div>

        <article className="note-editor">
          <div className="tags">
            <button type="button">Biology</button>
            <button type="button">Fall semester</button>
            <button className="add-tag" type="button" aria-label="Add tag">
              <Icon name="plus" size={14} />
            </button>
          </div>

          <textarea
            className="title-input"
            aria-label="Note title"
            defaultValue={"Biology Chapter 4 —\nCell Division"}
            onChange={() => setSaved(false)}
          />

          <div className="note-meta">
            <span>October 15, 2025</span>
            <i />
            <span>6 min read</span>
          </div>

          <div
            className="body-copy"
            contentEditable
            suppressContentEditableWarning
            onInput={() => setSaved(false)}
          >
            <p>
              Cell division allows organisms to grow, repair damaged structures, and
              reproduce. It is one of the most essential processes in all living cells.
            </p>
            <h2>The cell cycle</h2>
            <p>
              Before a cell divides, it moves through a carefully controlled sequence of
              stages known as the cell cycle.
            </p>
            <div className="callout">
              <span>
                <Icon name="sparkle" size={18} />
              </span>
              <p>
                <strong>Key idea</strong>
                DNA is copied during interphase so each new cell receives a complete set
                of genetic information.
              </p>
            </div>
            <h2>Stages of mitosis</h2>
            <ol>
              <li>
                <strong>Prophase</strong> — chromosomes condense and become visible.
              </li>
              <li>
                <strong>Metaphase</strong> — chromosomes align at the cell center.
              </li>
            </ol>
          </div>
        </article>
      </div>

      <div className="editor-footer">
        <div className="insert-tools">
          <button type="button" aria-label="Add attachment">
            <Icon name="paperclip" size={19} />
          </button>
          <button type="button" aria-label="Add image">
            <Icon name="image" size={19} />
          </button>
        </div>
        <button
          className={`save-status ${saved ? "saved" : ""}`}
          type="button"
          onClick={() => setSaved(true)}
        >
          {saved ? <Icon name="check" size={15} /> : null}
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>

      <BottomNav active="notes" onNavigate={onNavigate} />
    </main>
  );
}

const initialFiles = [
  { name: "Bio_Notes_Ch4.pdf", meta: "PDF · 2.4 MB · Today", color: "rose" },
  { name: "History_Diagram.png", meta: "PNG · 840 KB · Yesterday", color: "cyan" },
  { name: "Calculus_Worksheet.docx", meta: "DOCX · 180 KB · Sep 28", color: "yellow" },
  { name: "Organic_Chemistry_Lab.pdf", meta: "PDF · 4.1 MB · Sep 26", color: "green" },
];

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="section-topbar">
      <Wordmark />
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      {action ?? <span className="header-spacer" />}
    </header>
  );
}

function UploadsScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [files, setFiles] = useState(initialFiles);
  const [query, setQuery] = useState("");

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setFiles((current) => [
      ...selected.map((file) => ({
        name: file.name,
        meta: `${file.type.split("/").pop()?.toUpperCase() || "FILE"} · ${Math.max(
          1,
          Math.round(file.size / 1024),
        )} KB · Just now`,
        color: "yellow",
      })),
      ...current,
    ]);
    event.target.value = "";
  }

  const visibleFiles = files.filter((file) =>
    file.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main className="app-screen library-screen screen-enter">
      <SectionHeader
        title="Uploads"
        subtitle={`${files.length} files`}
        action={
          <label className="header-action" aria-label="Upload a file">
            <Icon name="plus" size={20} />
            <input type="file" multiple onChange={addFiles} />
          </label>
        }
      />

      <div className="library-content">
        <label className="drop-zone interactive-box">
          <span className="drop-icon">
            <Icon name="upload" size={27} />
          </span>
          <span>
            <strong>Upload study materials</strong>
            <small>PDF, images, documents · up to 25 MB</small>
            <b>Browse files</b>
          </span>
          <input type="file" multiple onChange={addFiles} />
        </label>

        <label className="search-field">
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your uploads"
          />
        </label>

        <div className="filter-chips">
          <button className="selected" type="button">
            Recent
          </button>
          <button type="button">PDF</button>
          <button type="button">Images</button>
          <button type="button">Docs</button>
        </div>

        <div className="storage-row">
          <span>{files.length} files</span>
          <span>1.8 of 5 GB</span>
        </div>
        <div className="storage-bar">
          <span />
        </div>

        <div className="file-list">
          {visibleFiles.map((file, index) => (
            <article className="file-row interactive-box" key={`${file.name}-${index}`}>
              <span className={`file-icon ${file.color}`}>
                <Icon name={file.name.match(/\.(png|jpg|jpeg)$/i) ? "image" : "file"} size={19} />
              </span>
              <span>
                <strong>{file.name}</strong>
                <small>{file.meta}</small>
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() =>
                  setFiles((current) => current.filter((item) => item !== file))
                }
              >
                <Icon name="more" size={18} />
              </button>
            </article>
          ))}
          {visibleFiles.length === 0 && (
            <div className="empty-state">No files match “{query}”.</div>
          )}
        </div>
      </div>

      <BottomNav active="uploads" onNavigate={onNavigate} />
    </main>
  );
}

function CaptureScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [scanning, setScanning] = useState(false);
  const [captured, setCaptured] = useState(false);

  function scan() {
    if (scanning) return;
    setCaptured(false);
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setCaptured(true);
    }, 2200);
  }

  return (
    <main className="app-screen capture-screen screen-enter">
      <SectionHeader title="Capture" subtitle="Smart document scan" />
      <div className="capture-content">
        <div className={`scanner-stage ${scanning ? "is-scanning" : ""}`}>
          <div className="wallpaper-shape shape-one" />
          <div className="wallpaper-shape shape-two" />
          <div className="wallpaper-shape shape-three" />
          <div className="scan-copy">
            <span className="scan-badge">
              <Icon name={captured ? "check" : "sparkle"} size={16} />
              {captured ? "Scan complete" : scanning ? "Finding document" : "AI document scanner"}
            </span>
            <h1>{captured ? "Perfect capture." : "Turn paper into study notes."}</h1>
            <p>
              {captured
                ? "Your page is clear, straightened, and ready to save."
                : "Hold your camera above a page. We’ll clean, crop, and sharpen it automatically."}
            </p>
          </div>

          <div className="scan-frame">
            <i className="corner top-left" />
            <i className="corner top-right" />
            <i className="corner bottom-left" />
            <i className="corner bottom-right" />
            <div className="paper-preview">
              <span />
              <span />
              <span />
              <span />
              <b />
            </div>
            <div className="scan-line" />
          </div>
        </div>

        <div className="capture-actions">
          <label className="gallery-button interactive-box">
            <Icon name="image" size={21} />
            From gallery
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                if (event.target.files?.length) setCaptured(true);
              }}
            />
          </label>
          <button
            className={`shutter-button ${scanning ? "scanning" : ""}`}
            type="button"
            onClick={scan}
            aria-label="Scan document"
          >
            <span>
              <Icon name="camera" size={25} />
            </span>
          </button>
          <button
            className="gallery-button interactive-box"
            type="button"
            onClick={() => setCaptured(true)}
          >
            <Icon name="clock" size={21} />
            Recent
          </button>
        </div>
        <p className="capture-hint">
          {scanning ? "Keep your device steady…" : "Tap the camera to start scanning"}
        </p>
      </div>
      <BottomNav active="capture" onNavigate={onNavigate} />
    </main>
  );
}

type SavedLink = {
  title: string;
  url: string;
  description: string;
  color: string;
};

const initialLinks: SavedLink[] = [
  {
    title: "MIT OpenCourseWare — Calculus",
    url: "youtube.com",
    description: "Integration techniques and worked examples.",
    color: "cyan",
  },
  {
    title: "Khan Academy: Organic Chemistry",
    url: "khanacademy.org",
    description: "Bonding, resonance, and reaction mechanisms.",
    color: "green",
  },
  {
    title: "Nature — How cells divide",
    url: "nature.com",
    description: "An illustrated overview of mitosis and cell-cycle regulation.",
    color: "yellow",
  },
];

function LinksScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [links, setLinks] = useState(initialLinks);
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");

  function saveLink(event: FormEvent) {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    const domain = value.replace(/^https?:\/\//, "").split("/")[0];
    setLinks((current) => [
      {
        title: domain || "Saved resource",
        url: domain || value,
        description: "New study resource · Saved just now",
        color: "rose",
      },
      ...current,
    ]);
    setUrl("");
  }

  const visibleLinks = links.filter(
    (link) =>
      link.title.toLowerCase().includes(query.toLowerCase()) ||
      link.url.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main className="app-screen library-screen screen-enter">
      <SectionHeader title="Links" subtitle={`${links.length} saved`} />
      <div className="library-content">
        <form className="save-link-card interactive-box" onSubmit={saveLink}>
          <div>
            <span className="drop-icon">
              <Icon name="link" size={21} />
            </span>
            <span>
              <strong>Save something useful</strong>
              <small>Keep articles, videos, and references together.</small>
            </span>
          </div>
          <label>
            <Icon name="link" size={16} />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Paste a URL…"
              type="url"
            />
            <button type="submit">Save</button>
          </label>
        </form>

        <label className="search-field">
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved links"
          />
        </label>

        <div className="filter-chips">
          <button className="selected" type="button">
            All
          </button>
          <button type="button">Articles</button>
          <button type="button">Videos</button>
          <button type="button">Topics</button>
        </div>

        <div className="list-heading">
          <strong>{visibleLinks.length} saved links</strong>
          <span>Newest first</span>
        </div>
        <div className="link-list">
          {visibleLinks.map((link, index) => (
            <article className="link-row interactive-box" key={`${link.url}-${index}`}>
              <span className={`file-icon ${link.color}`}>
                <Icon name="link" size={18} />
              </span>
              <span>
                <strong>{link.title}</strong>
                <b>{link.url}</b>
                <small>{link.description}</small>
              </span>
              <button
                type="button"
                aria-label={`Open ${link.title}`}
                onClick={() =>
                  window.open(
                    link.url.startsWith("http") ? link.url : `https://${link.url}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                <Icon name="arrow-right" size={17} />
              </button>
            </article>
          ))}
        </div>
      </div>
      <BottomNav active="links" onNavigate={onNavigate} />
    </main>
  );
}



function AccountDrawer({ user, onLogout, onClose }: { user: any, onLogout: () => void, onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ width: '80%', background: 'var(--bg, white)', padding: 20, height: '100%', color: 'var(--text, black)' }}>
        <button onClick={onClose} style={{ float: 'right', background: 'transparent', border: 'none', fontSize: 20 }}>&times;</button>
        <h2>Account</h2>
        <div style={{ marginTop: 20 }}>
          <p><strong>Name:</strong> {user?.name || 'Alex'}</p>
          <p><strong>Email:</strong> {user?.email || 'alex@example.com'}</p>
        </div>
        <button onClick={onLogout} style={{ marginTop: 40, width: '100%', padding: 15, background: '#d33f5e', color: 'white', border: 'none', borderRadius: 8 }}>Log Out</button>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const token = localStorage.getItem('ownly_auth_token');
    if (token) {
      setIsAuthenticated(true);
      setScreen("dashboard");
    }
    setIsCheckingAuth(false);
  }, []);

  if (isCheckingAuth) return null;

  return (
    <>
      {screen === "login" && <LoginScreen onLogin={(user) => {
        setIsAuthenticated(true);
        setUser(user);
        setScreen("dashboard");
      }} />}
      {screen === "dashboard" && <DashboardScreen onNavigate={setScreen} onMenuClick={() => setDrawerOpen(true)} darkMode={darkMode} toggleDark={() => setDarkMode(!darkMode)} />}
      {drawerOpen && <AccountDrawer user={user} onClose={() => setDrawerOpen(false)} onLogout={logout} />}
      {screen === "editor" && <EditorScreen onNavigate={setScreen} />}
      {screen === "uploads" && <UploadsScreen onNavigate={setScreen} />}
      {screen === "capture" && <CaptureScreen onNavigate={setScreen} />}
      {screen === "links" && <LinksScreen onNavigate={setScreen} />}
    </>
  );
}
