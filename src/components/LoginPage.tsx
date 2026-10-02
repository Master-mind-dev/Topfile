import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import * as api from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (profile: Partial<UserProfile>) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Detect reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset');
    if (token) {
      setResetToken(token);
      setMode('reset');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const switchMode = (m: typeof mode) => {
    setMode(m);
    setError('');
    setSuccess('');
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
    login: 'WELCOME BACK',
    signup: 'CREATE ACCOUNT',
    forgot: 'RESET PASSWORD',
    reset: 'NEW PASSWORD',
  }[mode];

  const subtitle = {
    login: 'Login',
    signup: 'Sign Up',
    forgot: 'Your request will be sent to the admin who will reset your password',
    reset: 'Enter your new password',
  }[mode];

  return (
    <div
      className="min-h-screen w-full text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden"
      id="figma-auth-screen"
    >
      <div className="ambient-glow-mesh">
        <div className="ambient-glow-1" />
        <div className="ambient-glow-2" />
        <div className="ambient-glow-cyan" />
      </div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-[492px] z-10 space-y-6"
      >
        {/* Brand */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">OWNLY</h1>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">{title}</h2>
          <p className="text-base font-bold text-white/70">{subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs text-center font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success.includes('http') ? (
                  <span dangerouslySetInnerHTML={{ __html: success.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline hover:text-white">$1</a>') }} />
              ) : (
                  <span>{success}</span>
              )}
            </div>
          )}

          {/* Name — signup only */}
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-xs font-black uppercase tracking-wider text-white/80">FULL NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-[58px] px-5 bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.14] border border-white/20 focus:border-white/50 rounded-2xl text-white placeholder-white/40 font-medium focus:outline-none transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-white/80">EMAIL</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@workspace.io"
                  required
                  className="w-full h-[58px] px-5 bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.14] border border-white/20 focus:border-white/50 rounded-2xl text-white placeholder-white/40 font-medium focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Password — login and signup */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-white/80">PASSWORD</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-bold text-white/60 hover:text-white transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[58px] pl-5 pr-12 bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.14] border border-white/20 focus:border-white/50 rounded-2xl text-white placeholder-white/40 font-medium focus:outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* New password — reset mode */}
          {mode === 'reset' && (
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-white/80">NEW PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full h-[58px] pl-5 pr-12 bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.14] border border-white/20 focus:border-white/50 rounded-2xl text-white placeholder-white/40 font-medium focus:outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-[204px] h-[58px] bg-white text-zinc-950 font-black text-base rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mode === 'forgot' ? <Mail className="w-4 h-4" /> : mode === 'reset' ? <KeyRound className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              <span>
                {isLoading ? 'Processing…'
                  : mode === 'login' ? 'Log in'
                  : mode === 'signup' ? 'Sign up'
                  : mode === 'forgot' ? 'Send request to admin'
                  : 'Set new password'}
              </span>
            </button>
          </div>

          {/* Bottom links */}
          <div className="text-center pt-2 space-y-2">
            {(mode === 'login' || mode === 'signup') && (
              <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer block w-full">
                {mode === 'login' ? 'No account? Sign up' : 'Already have an account? Log in'}
              </button>
            )}
            {(mode === 'forgot' || mode === 'reset') && (
              <button type="button" onClick={() => switchMode('login')} className="text-xs font-bold text-white/50 hover:text-white transition-colors cursor-pointer">
                ← Back to login
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};
