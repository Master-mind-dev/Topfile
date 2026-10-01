import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OwnlyLogo } from './OwnlyLogo';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';
import * as api from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (profile: Partial<UserProfile>) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Alex Rivera');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!cleanPass || cleanPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const user = await api.register(cleanEmail, cleanPass, name.trim());
        onLoginSuccess({
          email: user.email || cleanEmail,
          name: user.name || name.trim(),
        });
      } else {
        const user = await api.login(cleanEmail, cleanPass);
        onLoginSuccess({
          email: user.email || cleanEmail,
          name: user.name || cleanEmail.split('@')[0],
        });
      }
    } catch (err: any) {
      console.warn('Auth error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-['Inter',sans-serif]"
      id="figma-auth-screen"
    >
      {/* Background Animated Gradient Mesh */}
      <div className="ambient-glow-mesh">
        <div className="ambient-glow-1" />
        <div className="ambient-glow-2" />
        <div className="ambient-glow-cyan" />
      </div>

      {/* Frame 3: Auth Center Box (Figma Frame 1 specs: 1113x840 centered card) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px] z-10"
      >
        {/* Glass card */}
        <div className="bg-white/[0.05] border border-white/10 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/8 border border-white/12 mb-2 shadow-lg">
            <span className="text-2xl font-black text-white tracking-tighter">O</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            OWNLY
          </h1>
          <h2 className="text-lg font-bold text-white/70">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
        </div>

        {/* Form Card (Figma Rectangles 1, 2, 3) */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-white/80">
                FULL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full h-[58px] px-5 bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.14] border border-white/20 focus:border-white/50 rounded-2xl text-white placeholder-white/40 font-medium focus:outline-none transition-all"
              />
            </div>
          )}

          {/* Email Field (Rectangle 1) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-white/80">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@workspace.io"
              required
              className="w-full h-[58px] px-5 bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.14] border border-white/20 focus:border-white/50 rounded-2xl text-white placeholder-white/40 font-medium focus:outline-none transition-all"
            />
          </div>

          {/* Password Field (Rectangle 2) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-white/80">
                PASSWORD
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => alert('Please contact workspace support or create a new test account.')}
                  className="text-xs font-bold text-white/60 hover:text-white transition-colors"
                >
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Action Submit Button (Rectangle 3: 204x70 in Figma center) */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[54px] bg-gradient-to-r from-white to-zinc-100 text-zinc-950 font-black text-base rounded-2xl hover:from-zinc-100 hover:to-white active:scale-95 transition-all cursor-pointer shadow-xl shadow-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Processing…' : isSignUp ? 'Create account' : 'Log in'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle sign up / login */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Log in' : 'No account? Sign up'}
            </button>
          </div>
        </form>
        </div>{/* end glass card */}
      </motion.div>
    </div>
  );
};
