import React, { useState, useEffect, FormEvent } from 'react';
import { UserProfile } from '../types';
import * as api from '../lib/api';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (profile: Partial<UserProfile>) => void;
}

// New premium OWNLY O+Y logo mark (SVG)
function OwnlyLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="OWNLY">
      {/* Outer rounded square (the O) */}
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#111111" />
      {/* Inner white container */}
      <rect x="9" y="9" width="30" height="30" rx="8" fill="white" opacity="0.95" />
      {/* Hidden Y shape in crimson red */}
      <path d="M24 13 L18 20 L24 27 L30 20 Z" fill="#9f1239" />
      <rect x="22" y="27" width="4" height="9" rx="2" fill="#9f1239" />
      {/* Subtle top highlight */}
      <rect x="2" y="2" width="44" height="6" rx="14" fill="white" opacity="0.08" />
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

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset');
    if (token) {
      setResetToken(token);
      setMode('reset');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const switchMode = (m: typeof mode) => {
    setMode(m);
    setError('');
    setSuccess('');
    setPasswordVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const cleanEmail = email.trim();
        const cleanPass = password.trim();
        if (!cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');
        if (cleanPass.length < 6) throw new Error('Password must be at least 6 characters.');
        const user = await api.login(cleanEmail, cleanPass);
        onLoginSuccess({ email: user.email || cleanEmail, name: user.name || cleanEmail.split('@')[0] });

      } else if (mode === 'signup') {
        const cleanEmail = email.trim();
        const cleanPass = password.trim();
        if (!cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');
        if (cleanPass.length < 6) throw new Error('Password must be at least 6 characters.');
        const user = await api.register(cleanEmail, cleanPass, name.trim() || cleanEmail.split('@')[0]);
        onLoginSuccess({ email: user.email || cleanEmail, name: user.name || name.trim() });

      } else if (mode === 'forgot') {
        const cleanEmail = email.trim();
        if (!cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');
        await api.forgotPassword(cleanEmail);
        setSuccess('Request sent! The admin will reset your password and let you know the new one.');

      } else if (mode === 'reset') {
        if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
        await api.resetPassword(resetToken, newPassword);
        setSuccess('Password updated! You can now log in.');
        setTimeout(() => switchMode('login'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const title = {
    login: 'Login',
    signup: 'Sign Up',
    forgot: 'Reset Password',
    reset: 'New Password',
  }[mode];

  const subtitle = {
    login: 'Welcome back',
    signup: 'Create an account',
    forgot: 'Enter your email',
    reset: 'Set your new password',
  }[mode];

  return (
    <main className="login-screen screen-enter">
      {/* Blob orbs */}
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />

      {/* Floating particles */}
      {[...Array(10)].map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${8 + i * 9}%`,
          bottom: '-10px',
          width: i % 3 === 0 ? '5px' : '3px',
          height: i % 3 === 0 ? '5px' : '3px',
          opacity: 0.4 + (i % 3) * 0.15,
          animationDuration: `${7 + (i * 1.3)}s`,
          animationDelay: `${i * 0.6}s`,
          background: i % 4 === 0 ? 'rgba(200,255,250,0.6)' : 'rgba(255,255,255,0.45)',
        }} />
      ))}

      <form className="login-card" onSubmit={handleSubmit}>
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <OwnlyLogo size={46} />
          <div>
            <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.8px', lineHeight: 1.1 }}>OWNLY</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Knowledge · Notes · Files</div>
          </div>
        </div>

        <div className="login-heading">
          <p>{subtitle}</p>
          <h1>{title}</h1>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>

        )}
        {success && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>
            {success}
          </div>
        )}

        {mode === 'signup' && (
          <div className="field-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <div className="field-group password-field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                id="password"
                type={passwordVisible ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
        )}

        {mode === 'reset' && (
          <div className="field-group password-field">
            <label htmlFor="new-password">New Password</label>
            <div className="input-wrap">
              <input
                id="new-password"
                type={passwordVisible ? "text" : "password"}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
        )}

        {mode === 'login' && (
          <button className="forgot" type="button" onClick={() => switchMode('forgot')}>
            Forgot password?
          </button>
        )}

        {mode !== 'login' && (
          <div className="mt-4"></div> /* Spacer if no forgot button */
        )}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : (
            mode === 'login' ? <>Log in <ArrowRight size={18} /></> :
            mode === 'signup' ? <>Sign up <ArrowRight size={18} /></> :
            mode === 'forgot' ? 'Send request' : 'Reset password'
          )}
        </button>

        <p className="signup-copy">
          {mode === 'login' ? (
            <>No account? <button type="button" onClick={() => switchMode('signup')}>Sign up</button></>
          ) : mode === 'signup' ? (
            <>Already have an account? <button type="button" onClick={() => switchMode('login')}>Log in</button></>
          ) : (
            <button type="button" onClick={() => switchMode('login')}>← Back to login</button>
          )}
        </p>
      </form>
    </main>
  );
};
