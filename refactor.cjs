const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'dist', 'Mobile Login Screen Design', 'src', 'App.tsx');
const mainPath = path.join(__dirname, 'src', 'App.tsx');

let code = fs.readFileSync(srcPath, 'utf8');

// Add imports
code = `import * as api from './lib/api';
import { useRealtimeSync } from './hooks/useRealtimeSync';
` + code.replace('import { ChangeEvent, FormEvent, ReactNode, useState } from "react";', 'import { ChangeEvent, FormEvent, ReactNode, useState, useEffect } from "react";');

// Replace LoginScreen to use api
code = code.replace(
  `function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    onLogin();
  }`,
  `function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
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
  }`
);

// Add value and onChange to email input
code = code.replace(
  `<input id="email" type="email" placeholder="Enter your email" required />`,
  `<input id="email" type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} />`
);

// Add value and onChange to password input
code = code.replace(
  `defaultValue="studysmart"`,
  `value={password} onChange={(e) => setPassword(e.target.value)}`
);

// Show errors
code = code.replace(
  `<div className="field-group">`,
  `{error && <div style={{color: 'red', fontSize: '12px', marginTop: '10px'}}>{error}</div>}
        <div className="field-group">`
);

// Rewrite the main App component
const newApp = `
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

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
    <div className="app-shell">
      <div className="device">
        {screen === "login" && <LoginScreen onLogin={(user) => {
          setIsAuthenticated(true);
          setUser(user);
          setScreen("dashboard");
        }} />}
        {screen === "dashboard" && <DashboardScreen onNavigate={setScreen} />}
        {screen === "editor" && <EditorScreen onNavigate={setScreen} />}
        {screen === "uploads" && <UploadsScreen onNavigate={setScreen} />}
        {screen === "capture" && <CaptureScreen onNavigate={setScreen} />}
        {screen === "links" && <LinksScreen onNavigate={setScreen} />}
      </div>
    </div>
  );
}
`;

code = code.replace(/export default function App\(\) \{[\s\S]*\}\n?$/, newApp);

fs.writeFileSync(mainPath, code);
console.log('Successfully refactored src/App.tsx');
