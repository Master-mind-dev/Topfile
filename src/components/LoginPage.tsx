import React, { useState, useEffect, FormEvent } from 'react';
import { UserProfile } from '../types';
import * as api from '../lib/api';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (profile: Partial<UserProfile>) => void;
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
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <form className="login-card relative" onSubmit={handleSubmit}>
        <Wordmark light />

        <div className="login-heading">
          <p>{subtitle}</p>
          <h1>{title}</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs text-center font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs text-center font-medium">
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
