const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add menu icon to Icon component
code = code.replace(
  '"arrow-left": <path d="m15 18-6-6 6-6" />',
  '"menu": <path d="M4 6h16M4 12h16M4 18h16" />,\n    "arrow-left": <path d="m15 18-6-6 6-6" />'
);
code = code.replace(
  '| "arrow-left"',
  '| "menu"\n  | "arrow-left"'
);

// 2. Add Account Drawer state and UI to App
const accountDrawerStr = `
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
`;

if (!code.includes('function AccountDrawer')) {
  code = code.replace('export default function App() {', accountDrawerStr + '\nexport default function App() {');
}

// 3. Add dark mode toggle and state to App
code = code.replace(
  'const [user, setUser] = useState<any>(null);',
  'const [user, setUser] = useState<any>(null);\n  const [drawerOpen, setDrawerOpen] = useState(false);\n  const [darkMode, setDarkMode] = useState(false);\n  useEffect(() => {\n    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");\n  }, [darkMode]);'
);

code = code.replace(
  'return (',
  `function logout() {
    localStorage.removeItem('ownly_auth_token');
    setIsAuthenticated(false);
    setUser(null);
    setScreen('login');
    setDrawerOpen(false);
  }

  return (`
);

code = code.replace(
  '{screen === "dashboard" && <DashboardScreen onNavigate={setScreen} />}',
  '{screen === "dashboard" && <DashboardScreen onNavigate={setScreen} onMenuClick={() => setDrawerOpen(true)} darkMode={darkMode} toggleDark={() => setDarkMode(!darkMode)} />}\n      {drawerOpen && <AccountDrawer user={user} onClose={() => setDrawerOpen(false)} onLogout={logout} />}'
);

// 4. Update DashboardScreen props
code = code.replace(
  'function DashboardScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {',
  'function DashboardScreen({ onNavigate, onMenuClick, darkMode, toggleDark }: { onNavigate: (screen: Screen) => void, onMenuClick: () => void, darkMode: boolean, toggleDark: () => void }) {'
);

code = code.replace(
  '<Wordmark light />',
  `<button onClick={onMenuClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="menu" size={24} /></button>\n        <Wordmark light />`
);

code = code.replace(
  '<button className="avatar" type="button" aria-label="Open profile">',
  `<button onClick={toggleDark} style={{ background: 'transparent', border: 'none', marginRight: 10 }}>{darkMode ? '☀️' : '🌙'}</button>\n        <button className="avatar" type="button" aria-label="Open profile" onClick={onMenuClick}>`
);

// 5. Dashboard search state
code = code.replace(
  'function DashboardScreen({ onNavigate, onMenuClick, darkMode, toggleDark }: { onNavigate: (screen: Screen) => void, onMenuClick: () => void, darkMode: boolean, toggleDark: () => void }) {',
  'function DashboardScreen({ onNavigate, onMenuClick, darkMode, toggleDark }: { onNavigate: (screen: Screen) => void, onMenuClick: () => void, darkMode: boolean, toggleDark: () => void }) {\n  const [searchQuery, setSearchQuery] = useState("");\n  const [viewAll, setViewAll] = useState(false);'
);

// Update search input in Dashboard
code = code.replace(
  '<button className="search-button" type="button" aria-label="Search">\n            <Icon name="search" size={19} />\n          </button>',
  `<div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: 12, padding: '0 10px', marginTop: 10 }}>
            <Icon name="search" size={19} color="#888" />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              style={{ border: 'none', padding: '10px', width: '100%', background: 'transparent', outline: 'none' }} 
            />
          </div>`
);

// View all
code = code.replace(
  '<button type="button">View all</button>',
  '<button type="button" onClick={() => setViewAll(!viewAll)}>{viewAll ? "Show less" : "View all"}</button>'
);

fs.writeFileSync(path, code);
console.log('App patched successfully.');
