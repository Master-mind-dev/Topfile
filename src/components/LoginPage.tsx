import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OwnlyLogo } from './OwnlyLogo';
import { Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, Lock, Mail, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail 
} from '../lib/firebase';

interface LoginPageProps {
  onLoginSuccess: (profile: Partial<UserProfile>) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Mohammed Dastagir');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
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
        // Create user with Firebase Auth
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
          if (name.trim() && userCredential.user) {
            await updateProfile(userCredential.user, {
              displayName: name.trim()
            });
          }
          onLoginSuccess({
            email: userCredential.user.email || cleanEmail,
            name: name.trim() || userCredential.user.displayName || 'Workspace User',
          });
        } catch (signUpErr: any) {
          if (signUpErr.code === 'auth/email-already-in-use') {
            setError('This email already has an account. Please log in instead.');
          } else {
            throw signUpErr;
          }
        }
      } else {
        // Sign in with Firebase Auth
        try {
          const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
          onLoginSuccess({
            email: userCredential.user.email || cleanEmail,
            name: userCredential.user.displayName || (cleanEmail.startsWith('rmohammed') ? 'Mohammed Dastagir' : cleanEmail.split('@')[0]),
          });
        } catch (signInErr: any) {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.warn('Firebase auth attempt:', err);
      if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Email or password is incorrect.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait and try again.');
      } else if (err.message?.includes('Firebase is unavailable')) {
        setError('Firebase is not configured correctly. Add the valid Firebase Web API key in Render.');
      } else {
        setError('Unable to sign in right now. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err: any) {
      setError(err.code === 'auth/user-not-found' ? 'No account was found for this email.' : 'Could not send the reset email.');
    }
  };

  return (
    <div 
      className="ownly-login min-h-screen w-full text-white flex flex-col justify-between items-center px-5 py-6 sm:py-10 relative overflow-hidden selection:bg-[#ff304f] selection:text-white"
      id="ownly-auth-screen"
    >
      <div className="ownly-login__header w-full max-w-6xl flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <OwnlyLogo size="sm" />
          <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-[0.3em] text-white/45 border-l border-[#ff304f]/35 pl-3 ml-2">PRIVATE WORKSPACE</span>
        </div>

      </div>

      {/* Center Auth Card with Anime Starry Glow */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md my-auto z-10"
      >
        <div 
          className="ownly-login__panel w-full bg-black/75 border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
          id="login-card-container"
        >
          {/* Subtle Ambient Radial Light behind Card */}
          <div className="text-center mb-7">
            <OwnlyLogo size="lg" />
            <div className="text-[10px] tracking-[0.3em] text-[#ff304f] uppercase font-extrabold mt-5 mb-2">OWNLY ACCESS</div>
            <h1 className="ownly-login__title text-2xl sm:text-3xl font-bold tracking-tight text-white">{isSignUp ? 'Create account' : 'Welcome back'}</h1>
          </div>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="royal-login__form space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-extrabold tracking-wider uppercase text-white/70 mb-1 pl-1">
                  FULL NAME
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full bg-white text-black font-semibold placeholder:text-zinc-400 pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-white transition-all text-xs sm:text-sm shadow-inner"
                    id="input-name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-extrabold tracking-wider uppercase text-white/70 mb-1 pl-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-white text-black font-semibold placeholder:text-zinc-400 pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-white transition-all text-xs sm:text-sm shadow-inner"
                  id="input-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold tracking-wider uppercase text-white/70 mb-1 pl-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-white text-black font-semibold placeholder:text-zinc-400 pl-10 pr-11 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-white transition-all text-xs sm:text-sm shadow-inner"
                  id="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black transition-colors"
                  id="toggle-password-visibility"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setResetSent(false);
                  }}
                  className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
                  id="link-forgot-password"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#ff304f] text-white hover:bg-[#ff4f68] active:scale-[0.99] font-bold text-xs sm:text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg group"
                id="btn-login-submit"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black group-hover:border-white/30 group-hover:border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Workspace Account' : 'Log into Workspace'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Toggle Sign Up / Login */}
          <div className="mt-5 text-center text-xs">
            <span className="text-white/60 font-medium">
              {isSignUp ? 'Already have an account? ' : 'No account yet? '}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-[#ff6a7e] hover:text-white underline font-bold transition-colors cursor-pointer ml-1"
              id="btn-toggle-auth-mode"
            >
              {isSignUp ? 'Login' : 'Sign up'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-black border border-white/20 rounded-3xl p-6 shadow-2xl text-center relative"
            >
              <ShieldCheck className="w-10 h-10 text-white mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Reset Password</h3>
              <p className="text-xs text-white/50 mb-4">
                Enter your registered email address to receive password reset instructions.
              </p>

              {resetSent ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reset link sent to {email}</span>
                </div>
              ) : (
                <div className="mb-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered email"
                    className="w-full bg-white text-black font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-white/60 bg-white/5 border border-white/10 hover:text-white"
                >
                  Close
                </button>
                {!resetSent && (
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    className="flex-1 py-2.5 rounded-full text-xs font-bold text-black bg-[#E2E4E8] hover:bg-[#FF2A3A] hover:text-white transition-all duration-200 cursor-pointer"
                  >
                    Send Instructions
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="text-center text-white/40 text-[11px] font-medium z-10">
        <p>OWNLY Workspace Engine • Smooth Anime Atmosphere</p>
      </div>
    </div>
  );
};
