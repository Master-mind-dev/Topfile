import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OwnlyLogo } from './OwnlyLogo';
import { Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Flame } from 'lucide-react';
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
  const [email, setEmail] = useState('rmohammed7dastagir@gmail.com');
  const [password, setPassword] = useState('ownlyworkspace123');
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
      } else {
        // Sign in with Firebase Auth
        try {
          const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
          onLoginSuccess({
            email: userCredential.user.email || cleanEmail,
            name: userCredential.user.displayName || (cleanEmail.startsWith('rmohammed') ? 'Mohammed Dastagir' : cleanEmail.split('@')[0]),
          });
        } catch (signInErr: any) {
          // If user doesn't exist yet, automatically auto-provision account for smooth onboarding
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/invalid-login-credentials') {
            try {
              const autoCreated = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
              if (autoCreated.user) {
                const displayName = cleanEmail.startsWith('rmohammed') ? 'Mohammed Dastagir' : cleanEmail.split('@')[0];
                await updateProfile(autoCreated.user, { displayName });
                onLoginSuccess({
                  email: autoCreated.user.email || cleanEmail,
                  name: displayName,
                });
                return;
              }
            } catch (autoErr: any) {
              setError(signInErr.message?.replace('Firebase: ', '') || 'Invalid email or password credentials.');
            }
          } else {
            setError(signInErr.message?.replace('Firebase: ', '') || 'Authentication failed. Please check credentials.');
          }
        }
      }
    } catch (err: any) {
      console.warn('Firebase auth attempt:', err);
      // Friendly message translation
      if (err.code === 'auth/email-already-in-use') {
        // Auto sign in with password if existing
        try {
          const res = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
          onLoginSuccess({
            email: res.user.email || cleanEmail,
            name: res.user.displayName || name.trim() || 'Mohammed Dastagir',
          });
          return;
        } catch {
          setError('Email is already registered. Please click Login instead.');
        }
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError(err.message?.replace('Firebase: ', '') || 'Could not authenticate. Please retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsLoading(true);
    setError('');
    const demoEmail = 'rmohammed7dastagir@gmail.com';
    const demoPass = 'ownlyworkspace123';
    const demoName = 'Mohammed Dastagir';

    try {
      const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      onLoginSuccess({
        email: userCredential.user.email || demoEmail,
        name: userCredential.user.displayName || demoName,
      });
    } catch {
      try {
        const created = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        if (created.user) {
          await updateProfile(created.user, { displayName: demoName });
        }
        onLoginSuccess({
          email: demoEmail,
          name: demoName,
        });
      } catch {
        // Direct session fallback
        onLoginSuccess({
          email: demoEmail,
          name: demoName,
        });
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
      setResetSent(true); // show confirmation to avoid user enumeration
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-black text-white flex flex-col justify-between items-center px-4 py-8 sm:py-12 relative overflow-hidden"
      id="ownly-auth-screen"
    >
      {/* Background ambient accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF2A3A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar branding */}
      <div className="w-full max-w-5xl flex justify-end items-center z-10">
        <button
          onClick={handleQuickDemoLogin}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-colors cursor-pointer"
          id="btn-quick-demo-login"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          Instant Demo Access
        </button>
      </div>

      {/* Center Auth Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md my-auto z-10"
      >
        <div 
          className="w-full bg-white/5 border border-white/20 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative"
          id="login-card-container"
        >
          {/* Top Logo in Card */}
          <div className="text-center mb-5">
            <OwnlyLogo size="lg" />
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold mb-1">
              WORKSPACE ACCESS
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
              {isSignUp ? 'CREATE AN ACCOUNT' : 'WELCOME BACK'}
            </h1>
            <p className="text-sm font-medium text-white/60">
              {isSignUp ? 'Sign Up' : 'Login'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-white/60 mb-1.5 pl-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full bg-white text-black font-semibold placeholder:text-zinc-400 px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-white transition-all text-sm shadow-inner"
                  id="input-name"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-white/60 mb-1.5 pl-1">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-white text-black font-semibold placeholder:text-zinc-400 px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-white transition-all text-sm shadow-inner"
                id="input-email"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-white/60 mb-1.5 pl-1">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-white text-black font-semibold placeholder:text-zinc-400 px-4 py-3 pr-11 rounded-2xl outline-none focus:ring-2 focus:ring-white transition-all text-sm shadow-inner"
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

            {/* Log in Button with vivid red hover style */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black hover:bg-[#FF2A3A] hover:text-white active:scale-[0.99] font-bold text-sm py-3 rounded-full transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                id="btn-login-submit"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black group-hover:border-white/30 group-hover:border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Log in'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Toggle Sign Up / Login */}
          <div className="mt-6 text-center text-xs sm:text-sm">
            <span className="text-white/60 font-medium">
              {isSignUp ? 'Already have an account? ' : 'No account? '}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-white hover:underline font-bold transition-colors cursor-pointer ml-1"
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
              className="w-full max-w-sm bg-black border border-white/20 rounded-3xl p-6 shadow-2xl text-center"
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
                    placeholder="Enter email"
                    className="w-full bg-white text-black font-semibold px-4 py-2.5 rounded-xl text-sm outline-none"
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
      <div className="text-center text-white/30 text-xs font-medium z-10">
        <p>OWNLY Workspace Platform • High Density System</p>
      </div>
    </div>
  );
};
